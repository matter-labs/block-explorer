import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Block } from "../block/block.entity";
import { IndexerStateService } from "../indexerState/indexerState.service";

// A month that is not fully indexed yet (the current one, or a past one the indexer hasn't finished) can still change.
export const INCOMPLETE_MONTH_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedCount {
  count: number;
  // null for fully indexed months, their count never changes
  expiresAt: number | null;
}

// "2026-10" -> "2026-11", "2026-12" -> "2027-01"
const getNextMonth = (month: string): string => {
  const [year, monthNumber] = month.split("-").map(Number);
  return monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, "0")}`;
};

@Injectable()
export class MonthlyTransactionService {
  private readonly cache = new Map<string, CachedCount>();
  // Concurrent requests for the same month wait for the same query instead of starting their own.
  private readonly pending = new Map<string, Promise<number>>();

  public constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly indexerStateService: IndexerStateService
  ) {}

  // Returns the number of transactions in the given calendar month (YYYY-MM, UTC) up to the last ready block.
  public async getCount(month: string): Promise<number> {
    const cached = this.cache.get(month);
    if (cached && (cached.expiresAt === null || Date.now() < cached.expiresAt)) {
      return cached.count;
    }

    let pending = this.pending.get(month);
    if (!pending) {
      pending = this.fetchAndCache(month).finally(() => this.pending.delete(month));
      this.pending.set(month, pending);
    }
    return pending;
  }

  private async fetchAndCache(month: string): Promise<number> {
    const monthStart = `${month}-01`;
    const nextMonthStart = `${getNextMonth(month)}-01`;

    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    // Block timestamps never decrease, so the month is the range between its first and last block.
    const [firstBlockNumber, lastBlockNumber, nextMonthFirstBlockNumber] = await Promise.all([
      this.getFirstBlockNumberFrom(monthStart),
      this.getLastBlockNumberBefore(nextMonthStart),
      this.getFirstBlockNumberFrom(nextMonthStart),
    ]);

    let count = 0;
    if (firstBlockNumber !== undefined && lastBlockNumber !== undefined) {
      const toBlockNumber = Math.min(lastBlockNumber, lastReadyBlockNumber);
      if (firstBlockNumber <= toBlockNumber) {
        count = await this.sumTransactions(firstBlockNumber, toBlockNumber);
      }
    }

    const isComplete = nextMonthFirstBlockNumber !== undefined && nextMonthFirstBlockNumber <= lastReadyBlockNumber;
    this.cache.set(month, {
      count,
      expiresAt: isComplete ? null : Date.now() + INCOMPLETE_MONTH_CACHE_TTL_MS,
    });
    return count;
  }

  private async getFirstBlockNumberFrom(timestamp: string): Promise<number | undefined> {
    const block = await this.blockRepository
      .createQueryBuilder("block")
      .select("block.number")
      .where("block.timestamp >= :timestamp", { timestamp })
      .orderBy("block.timestamp", "ASC")
      .addOrderBy("block.number", "ASC")
      .limit(1)
      .getOne();
    return block?.number;
  }

  private async getLastBlockNumberBefore(timestamp: string): Promise<number | undefined> {
    const block = await this.blockRepository
      .createQueryBuilder("block")
      .select("block.number")
      .where("block.timestamp < :timestamp", { timestamp })
      .orderBy("block.timestamp", "DESC")
      .addOrderBy("block.number", "DESC")
      .limit(1)
      .getOne();
    return block?.number;
  }

  private async sumTransactions(fromBlockNumber: number, toBlockNumber: number): Promise<number> {
    const result = await this.blockRepository
      .createQueryBuilder("block")
      .select(`COALESCE(SUM(block."l1TxCount" + block."l2TxCount"), 0)`, "count")
      .where("block.number BETWEEN :fromBlockNumber AND :toBlockNumber", { fromBlockNumber, toBlockNumber })
      .getRawOne<{ count: string }>();
    return Number(result.count);
  }
}
