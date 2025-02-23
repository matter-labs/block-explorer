import { Injectable, Logger } from "@nestjs/common";
import { utils } from "zksync-ethers";
import { BlockchainService } from "../blockchain/blockchain.service";
import { TokenType } from "../token/token.service";
import { Transfer } from "../transfer/interfaces/transfer.interface";

export type BlockChangedBalances = Map<string, Map<string, { balance: bigint; tokenType: TokenType }>>;

export interface Balance {
  address: string;
  tokenAddress: string;
  blockNumber: number;
  balance: bigint;
  tokenType: TokenType;
}

@Injectable()
export class BalanceService {
  private readonly logger: Logger;
  public changedBalances: Map<number, BlockChangedBalances>;

  constructor(private readonly blockchainService: BlockchainService) {
    this.logger = new Logger(BalanceService.name);
    this.changedBalances = new Map<number, BlockChangedBalances>();
  }

  public clearTrackedState(blockNumber: number): void {
    this.changedBalances.delete(blockNumber);
  }

  public trackChangedBalances(transfers: Transfer[]): void {
    if (!transfers?.length) {
      return;
    }

    const blockChangedBalances =
      this.changedBalances.get(transfers[0].blockNumber) ||
      new Map<string, Map<string, { balance: bigint; tokenType: TokenType }>>();

    for (const transfer of transfers) {
      const changedBalancesAddresses = new Set([transfer.from, transfer.to]);
      for (const changedBalanceAddress of changedBalancesAddresses) {
        if (changedBalanceAddress === utils.ETH_ADDRESS) {
          continue;
        }

        if (!blockChangedBalances.has(changedBalanceAddress)) {
          blockChangedBalances.set(changedBalanceAddress, new Map<string, { balance: bigint; tokenType: TokenType }>());
        }

        blockChangedBalances
          .get(changedBalanceAddress)
          .set(transfer.tokenAddress, { balance: undefined, tokenType: transfer.tokenType });
      }
    }

    this.changedBalances.set(transfers[0].blockNumber, blockChangedBalances);
  }

  public async getChangedBalances(blockNumber: number): Promise<Balance[]> {
    if (!this.changedBalances.has(blockNumber)) {
      return null;
    }

    const blockChangedBalances = this.changedBalances.get(blockNumber);
    const balanceAddresses: string[][] = [];
    const getBalancePromises: Promise<bigint>[] = [];

    for (const [address, tokenAddresses] of blockChangedBalances) {
      for (const [tokenAddress] of tokenAddresses) {
        balanceAddresses.push([address, tokenAddress]);
        getBalancePromises.push(this.blockchainService.getBalance(address, blockNumber, tokenAddress));
      }
    }

    this.logger.debug({ message: "Getting balances from the blockchain.", blockNumber });
    const balances = await Promise.allSettled(getBalancePromises);

    for (let i = 0; i < balances.length; i++) {
      const [address, tokenAddress] = balanceAddresses[i];
      if (balances[i].status === "fulfilled") {
        const blockChangedBalancesForAddress = blockChangedBalances.get(address);
        blockChangedBalancesForAddress.set(tokenAddress, {
          balance: (balances[i] as PromiseFulfilledResult<bigint>).value,
          tokenType: blockChangedBalancesForAddress.get(tokenAddress).tokenType,
        });
      } else {
        this.logger.warn({
          message: "Get balance for token failed",
          tokenAddress,
          address,
          blockNumber,
          reason: (balances[i] as PromiseRejectedResult).reason,
        });
        // since we have internal retries for contract and RPC calls if an error gets through to here
        // it means it is not retryable and happens because balanceOf function is not defined or fails with a permanent error in the contract
        // in such case we're not saving the balance at all
        blockChangedBalances.get(address).delete(tokenAddress);
      }
    }

    const balanceRecords: Balance[] = [];

    for (const [address, addressTokenBalances] of blockChangedBalances) {
      for (const [tokenAddress, addressTokenBalance] of addressTokenBalances) {
        balanceRecords.push({
          address,
          tokenAddress,
          blockNumber,
          balance: addressTokenBalance.balance,
          tokenType: addressTokenBalance.tokenType,
        });
      }
    }

    return balanceRecords;
  }
}
