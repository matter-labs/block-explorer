import { Injectable, Logger } from "@nestjs/common";
import { BigNumber } from "ethers";
import { utils } from "zksync-web3";
import { Histogram } from "prom-client";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { ConfigService } from "@nestjs/config";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BalanceRepository } from "../repositories";
import { Balance } from "../entities";
import { Transfer } from "../transfer/interfaces/transfer.interface";

import { DELETE_OLD_BALANCES_DURATION_METRIC_NAME, DELETE_ZERO_BALANCES_DURATION_METRIC_NAME } from "../metrics";

@Injectable()
export class BalanceService {
  private readonly disableBalancesProcessing: boolean;
  private readonly logger: Logger;
  public changedBalances: Map<number, Map<string, Map<string, BigNumber>>>;

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly balanceRepository: BalanceRepository,
    @InjectMetric(DELETE_OLD_BALANCES_DURATION_METRIC_NAME)
    private readonly deleteOldBalancesDurationMetric: Histogram,
    @InjectMetric(DELETE_ZERO_BALANCES_DURATION_METRIC_NAME)
    private readonly deleteZeroBalancesDurationMetric: Histogram,
    configService: ConfigService
  ) {
    this.logger = new Logger(BalanceService.name);
    this.changedBalances = new Map<number, Map<string, Map<string, BigNumber>>>();
    this.disableBalancesProcessing = configService.get<boolean>("balances.disableBalancesProcessing");
  }

  public clearTrackedState(blockNumber: number): void {
    this.changedBalances.delete(blockNumber);
  }

  public trackChangedBalances(transfers: Transfer[]): void {
    if (!transfers?.length) {
      return;
    }

    const blockChangedBalances =
      this.changedBalances.get(transfers[0].blockNumber) || new Map<string, Map<string, BigNumber>>();

    for (const transfer of transfers) {
      const changedBalancesAddresses = new Set([transfer.from, transfer.to]);
      for (const changedBalanceAddress of changedBalancesAddresses) {
        if (changedBalanceAddress === utils.ETH_ADDRESS) {
          continue;
        }

        if (!blockChangedBalances.has(changedBalanceAddress)) {
          blockChangedBalances.set(changedBalanceAddress, new Map<string, BigNumber>());
        }

        blockChangedBalances.get(changedBalanceAddress).set(transfer.tokenAddress, undefined);
      }
    }

    this.changedBalances.set(transfers[0].blockNumber, blockChangedBalances);
  }

  public async saveChangedBalances(blockNumber: number): Promise<void> {
    if (!this.changedBalances.has(blockNumber)) {
      return;
    }

    const blockChangedBalances = this.changedBalances.get(blockNumber);
    const balanceAddresses: string[][] = [];
    const getBalancePromises: Promise<BigNumber>[] = [];

    if (!this.disableBalancesProcessing) {
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
          blockChangedBalances.get(address).set(tokenAddress, (balances[i] as PromiseFulfilledResult<BigNumber>).value);
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
    }

    const balanceRecords: Partial<Balance>[] = [];

    for (const [address, balances] of blockChangedBalances) {
      for (const [tokenAddress, balance] of balances) {
        balanceRecords.push({
          address,
          tokenAddress,
          blockNumber,
          balance: this.disableBalancesProcessing ? BigNumber.from("-1") : balance,
        });
      }
    }

    await this.balanceRepository.addMany(balanceRecords);
  }

  public async deleteOldBalances(fromBlockNumber: number, toBlockNumber: number): Promise<void> {
    this.logger.log({ message: "Deleting old balances", fromBlockNumber, toBlockNumber });
    const stopDeleteBalancesDurationMeasuring = this.deleteOldBalancesDurationMetric.startTimer();
    try {
      await this.balanceRepository.deleteOldBalances(fromBlockNumber, toBlockNumber);
    } catch (error) {
      this.logger.error("Error on deleting old balances", error.stack);
    }
    stopDeleteBalancesDurationMeasuring();
  }

  public async deleteZeroBalances(fromBlockNumber: number, toBlockNumber: number): Promise<void> {
    this.logger.log({ message: "Deleting zero balances", fromBlockNumber, toBlockNumber });
    const stopDeleteBalancesDurationMeasuring = this.deleteZeroBalancesDurationMetric.startTimer();
    try {
      await this.balanceRepository.deleteZeroBalances(fromBlockNumber, toBlockNumber);
    } catch (error) {
      this.logger.error("Error on deleting zero balances", error.stack);
    }
    stopDeleteBalancesDurationMeasuring();
  }

  public async getDeleteBalancesFromBlockNumber(): Promise<number> {
    return await this.balanceRepository.getDeleteBalancesFromBlockNumber();
  }

  public async setDeleteBalancesFromBlockNumber(fromBlockNumber: number): Promise<void> {
    await this.balanceRepository.setDeleteBalancesFromBlockNumber(fromBlockNumber);
  }
}
