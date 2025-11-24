import { Injectable } from "@nestjs/common";
import { type TransactionResponse } from "ethers";
import { Transaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { AddressTransactionRepository } from "./addressTransaction.repository";

export interface TransactionDto extends TransactionResponse {
  error?: string;
  revertReason?: string;
}

@Injectable()
export class TransactionRepository extends BaseRepository<Transaction> {
  public constructor(
    unitOfWork: UnitOfWork,
    private readonly addressTransactionRepository: AddressTransactionRepository
  ) {
    super(Transaction, unitOfWork);
  }

  public override async add(record: Partial<Transaction>): Promise<void> {
    await super.add(record);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { number, ...addressTransaction } = record;
    const addressTransactions = [
      {
        ...addressTransaction,
        address: record.from,
        transactionHash: record.hash,
      },
    ];
    if (record.from !== record.to) {
      addressTransactions.push({
        ...addressTransaction,
        address: record.to,
        transactionHash: record.hash,
      });
    }
    await this.addressTransactionRepository.addMany(addressTransactions);
  }
}
