import { Injectable, Logger } from "@nestjs/common";
import { InternalTransactionRepository } from "../repositories";
import { InternalTransaction } from "../dataFetcher/types";

@Injectable()
export class InternalTransactionService {
  private readonly logger: Logger;

  constructor(private readonly internalTransactionRepository: InternalTransactionRepository) {
    this.logger = new Logger(InternalTransactionService.name);
  }

  public async addInternalTransactions(
    transactionHash: string,
    internalTransactions: InternalTransaction[]
  ): Promise<void> {
    if (!internalTransactions || internalTransactions.length === 0) {
      return;
    }

    this.logger.debug({
      message: "Saving internal transactions to the DB",
      transactionHash,
      count: internalTransactions.length,
    });

    await this.internalTransactionRepository.replaceForTransaction(transactionHash, internalTransactions);
  }
}
