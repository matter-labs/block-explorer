import { Injectable, Logger } from "@nestjs/common";
import { types } from "zksync-ethers";
import { AddressService } from "../address/address.service";
import { BalanceService } from "../balance/balance.service";
import { TransferService } from "../transfer/transfer.service";
import { TokenService } from "../token/token.service";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { ContractAddress } from "../address/interface/contractAddress.interface";
import { Token } from "../token/token.service";

export interface LogsData {
  transfers: Transfer[];
  contractAddresses?: ContractAddress[];
  tokens?: Token[];
}

@Injectable()
export class LogService {
  private readonly logger: Logger;

  public constructor(
    private readonly addressService: AddressService,
    private readonly balanceService: BalanceService,
    private readonly transferService: TransferService,
    private readonly tokenService: TokenService
  ) {
    this.logger = new Logger(LogService.name);
  }

  public async getData(
    logs: ReadonlyArray<types.Log>,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails,
    transactionReceipt?: types.TransactionReceipt
  ): Promise<LogsData> {
    const transfers = this.transferService.getTransfers(logs, blockDetails, transactionDetails, transactionReceipt);

    const logsData: LogsData = {
      transfers,
    };

    this.balanceService.trackChangedBalances(transfers);

    if (transactionReceipt) {
      const transactionHash = transactionReceipt.hash;

      this.logger.debug({ message: "Extracting contracts", blockNumber: blockDetails.number, transactionHash });
      const contractAddresses = await this.addressService.getContractAddresses(logs, transactionReceipt);

      this.logger.debug({
        message: "Extracting ERC20 tokens",
        blockNumber: blockDetails.number,
        transactionHash,
      });
      const tokens = (
        await Promise.all(
          contractAddresses.map((contractAddress) =>
            this.tokenService.getERC20Token(contractAddress, transactionReceipt)
          )
        )
      ).filter((token) => !!token);

      logsData.contractAddresses = contractAddresses;
      logsData.tokens = tokens;
    }

    return logsData;
  }
}
