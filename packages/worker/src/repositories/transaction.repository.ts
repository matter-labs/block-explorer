import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type TransactionResponse } from "ethers";
import { Transaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { AddressTransactionRepository } from "./addressTransaction.repository";
import { VisibleTransactionRepository } from "./visibleTransaction.repository";
import { AddressVisibleTransactionRepository } from "./addressVisibleTransaction.repository";
import { computeFromToMinMax } from "../utils/computeFromToMinMax";
import { extractAddressFromTopic } from "../utils/extractAddressFromTopic";

export interface TransactionDto extends TransactionResponse {
  error?: string;
  revertReason?: string;
}

@Injectable()
export class TransactionRepository extends BaseRepository<Transaction> {
  public constructor(
    unitOfWork: UnitOfWork,
    private readonly addressTransactionRepository: AddressTransactionRepository,
    private readonly visibleTransactionRepository: VisibleTransactionRepository,
    private readonly addressVisibleTransactionRepository: AddressVisibleTransactionRepository,
    private readonly configService: ConfigService
  ) {
    super(Transaction, unitOfWork);
  }

  public override async add(
    record: Partial<Transaction>,
    logs?: readonly { address: string; topics: readonly string[] }[]
  ): Promise<void> {
    const fromToMinMax = computeFromToMinMax(record.from, record.to);
    await super.add({ ...record, ...fromToMinMax });

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
    if (
      this.configService.get("prividium.enabled") &&
      !this.configService.get("prividium.disableTxVisibilityByTopics")
    ) {
      const { visibleRows, addressVisibleRows } = buildVisibleTransactionRows(record, logs);
      await this.visibleTransactionRepository.addMany(visibleRows);
      await this.addressVisibleTransactionRepository.addMany(addressVisibleRows);
    }
  }
}

const buildVisibleTransactionRows = (
  record: Partial<Transaction>,
  logs: readonly { address: string; topics: readonly string[] }[] = []
) => {
  const base = {
    transactionHash: record.hash,
    blockNumber: record.blockNumber,
    receivedAt: record.receivedAt,
    transactionIndex: record.transactionIndex,
  };

  const owners = [...new Set([record.from, record.to].filter(Boolean))];

  const topicViewers = new Set<string>();
  for (const log of logs) {
    topicViewers.add(log.address);
    for (let i = 1; i <= 3; i++) {
      const addr = extractAddressFromTopic(log.topics[i]);
      if (addr) topicViewers.add(addr);
    }
  }
  const viewers = [...new Set([record.from, record.to, ...topicViewers].filter(Boolean))];

  const visibleRows = viewers.map((visibleBy) => ({ ...base, visibleBy }));

  const addressVisibleRows = [];
  for (const address of owners) {
    for (const visibleBy of viewers) {
      // skip address === visibleBy to save some storage: own transactions are handled by visibleTransactions table or addressTransactions table
      if (address !== visibleBy) {
        addressVisibleRows.push({ ...base, address, visibleBy });
      }
    }
  }

  return { visibleRows, addressVisibleRows };
};
