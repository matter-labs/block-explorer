import { Injectable, Logger } from "@nestjs/common";
import { types } from "zksync-web3";
import { AddressService } from "../address/address.service";
import { BalanceService } from "../balance/balance.service";
import { TransferService } from "../transfer/transfer.service";
import { TokenService } from "../token/token.service";
import { LogRepository } from "../repositories";
import { unixTimeToDate } from "../utils/date";

@Injectable()
export class LogProcessor {
  private readonly logger: Logger;

  public constructor(
    private readonly addressService: AddressService,
    private readonly balanceService: BalanceService,
    private readonly transferService: TransferService,
    private readonly tokenService: TokenService,
    private readonly logRepository: LogRepository
  ) {
    this.logger = new Logger(LogProcessor.name);
  }

  public async process(
    logs: types.Log[],
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails,
    transactionReceipt?: types.TransactionReceipt
  ): Promise<void> {
    const transactionHash = transactionReceipt?.transactionHash;

    this.logger.debug({ message: "Adding logs data to the DB", blockNumber: blockDetails.number, transactionHash });
    await this.logRepository.addMany(
      logs.map((log) => ({
        ...log,
        timestamp: transactionDetails?.receivedAt || unixTimeToDate(blockDetails.timestamp),
      }))
    );

    this.logger.debug({ message: "Saving transaction transfers", blockNumber: blockDetails.number, transactionHash });
    const transfers = await this.transferService.saveTransfers(
      logs,
      blockDetails,
      transactionDetails,
      transactionReceipt
    );

    this.balanceService.trackChangedBalances(transfers);

    if (transactionReceipt) {
      this.logger.debug({ message: "Saving contracts", blockNumber: blockDetails.number, transactionHash });
      const contractAddresses = await this.addressService.saveContractAddresses(logs, transactionReceipt);

      this.logger.debug({
        message: "Extracting and saving ERC20 token",
        blockNumber: blockDetails.number,
        transactionHash,
      });
      await Promise.all(
        contractAddresses.map((contractAddress) =>
          this.tokenService.saveERC20Token(contractAddress, transactionReceipt)
        )
      );
    }
  }
}
