import { Injectable } from "@nestjs/common";
import { InternalTransaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class InternalTransactionRepository extends BaseRepository<InternalTransaction> {
  public constructor(unitOfWork: UnitOfWork) {
    super(InternalTransaction, unitOfWork);
  }

  /**
   * Replace all internal transactions for a given transaction hash.
   * This ensures idempotency on re-processing.
   * @param transactionHash The transaction hash
   * @param records The new internal transaction records
   */
  public async replaceForTransaction(transactionHash: string, records: Partial<InternalTransaction>[]): Promise<void> {
    // Delete existing records for this transaction
    await this.delete({ transactionHash } as any);

    // Insert new records if any
    if (records && records.length > 0) {
      await this.addMany(records);
    }
  }
}
