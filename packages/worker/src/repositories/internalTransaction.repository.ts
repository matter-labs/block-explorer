import { Injectable } from "@nestjs/common";
import { InternalTransaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { AddressInternalTransactionRepository } from "./addressInternalTransaction.repository";

@Injectable()
export class InternalTransactionRepository extends BaseRepository<InternalTransaction> {
  public constructor(
    unitOfWork: UnitOfWork,
    private readonly addressInternalTransactionRepository: AddressInternalTransactionRepository
  ) {
    super(InternalTransaction, unitOfWork);
  }

  public override async add(record: Partial<InternalTransaction>): Promise<void> {
    await super.add(record);
    await this.addAddressInternalTransactions([record]);
  }

  public override async addMany(records: Partial<InternalTransaction>[]): Promise<void> {
    await super.addMany(records);
    await this.addAddressInternalTransactions(records);
  }

  private async addAddressInternalTransactions(records: Partial<InternalTransaction>[]): Promise<void> {
    const addressInternalTransactions = records.flatMap((record) => {
      const baseRecord = {
        transactionHash: record.transactionHash,
        traceAddress: record.traceAddress,
        blockNumber: record.blockNumber,
        timestamp: record.timestamp,
        traceIndex: record.traceIndex,
      };

      const denormalizedRecords = [];

      if (record.from) {
        denormalizedRecords.push({
          ...baseRecord,
          address: record.from,
        });
      }

      if (record.to && record.to !== record.from) {
        denormalizedRecords.push({
          ...baseRecord,
          address: record.to,
        });
      }

      return denormalizedRecords;
    });

    if (addressInternalTransactions.length === 0) {
      return;
    }

    await this.addressInternalTransactionRepository.addMany(addressInternalTransactions);
  }
}
