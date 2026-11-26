import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { mock } from "jest-mock-extended";
import { Block } from "../block/block.entity";
import { BlockService } from "../block/block.service";
import { IndexerStateService } from "../indexerState/indexerState.service";
import { MonthlyTransactionService, INCOMPLETE_MONTH_CACHE_TTL_MS } from "./monthlyTransaction.service";

describe("MonthlyTransactionService", () => {
  let service: MonthlyTransactionService;
  let indexerStateServiceMock: IndexerStateService;
  // first block with timestamp >= key
  let firstBlockFrom: Record<string, number>;
  // last block with timestamp < key
  let lastBlockBefore: Record<string, number>;
  let lastReadyBlockNumber: number;
  let lastExecutedBlockNumber: number;
  let sumMock: jest.Mock;

  beforeEach(async () => {
    jest.useFakeTimers({ now: new Date("2026-11-15T00:00:00Z") });
    // October 2026 is blocks 100-199, November 2026 starts at block 200
    firstBlockFrom = { "2026-10-01": 100, "2026-11-01": 200 };
    lastBlockBefore = { "2026-11-01": 199, "2026-12-01": 260 };
    lastReadyBlockNumber = 250;
    lastExecutedBlockNumber = 220;
    sumMock = jest.fn().mockResolvedValue(1000);

    const blockRepositoryMock = mock<Repository<Block>>({
      createQueryBuilder: jest.fn().mockImplementation(() => {
        let condition: string;
        let params: Record<string, string | number>;
        const queryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockImplementation((whereCondition, whereParams) => {
            condition = whereCondition;
            params = whereParams;
            return queryBuilder;
          }),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockImplementation(async () => {
            const blocks = condition.includes(">=") ? firstBlockFrom : lastBlockBefore;
            const number = blocks[params.timestamp as string];
            return number === undefined ? null : { number };
          }),
          getRawOne: jest.fn().mockImplementation(async () => ({
            count: String(await sumMock(params.fromBlockNumber, params.toBlockNumber)),
          })),
        };
        return queryBuilder;
      }),
    });
    indexerStateServiceMock = mock<IndexerStateService>({
      getLastReadyBlockNumber: jest.fn().mockImplementation(async () => lastReadyBlockNumber),
    });

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        MonthlyTransactionService,
        { provide: getRepositoryToken(Block), useValue: blockRepositoryMock },
        { provide: IndexerStateService, useValue: indexerStateServiceMock },
        {
          provide: BlockService,
          useValue: mock<BlockService>({
            getLastVerifiedBlockNumber: jest.fn().mockImplementation(async () => lastExecutedBlockNumber),
          }),
        },
      ],
    }).compile();

    service = app.get<MonthlyTransactionService>(MonthlyTransactionService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getCount", () => {
    it("sums transactions of the month's blocks", async () => {
      const result = await service.getCount("2026-10");
      expect(sumMock).toHaveBeenCalledWith(100, 199);
      expect(result).toBe(1000);
    });

    it("counts only blocks up to the last ready block", async () => {
      lastReadyBlockNumber = 150;
      await service.getCount("2026-10");
      expect(sumMock).toHaveBeenCalledWith(100, 150);
    });

    it("uses January of the next year as the end of December", async () => {
      firstBlockFrom = { "2026-12-01": 300, "2027-01-01": 400 };
      lastBlockBefore = { "2027-01-01": 399 };
      lastReadyBlockNumber = 500;
      await service.getCount("2026-12");
      expect(sumMock).toHaveBeenCalledWith(300, 399);
    });

    it("returns 0 without summing when the month has no blocks", async () => {
      // the first block from October is already in November, the last block before November is in September
      firstBlockFrom = { "2026-10-01": 200, "2026-11-01": 200 };
      lastBlockBefore = { "2026-11-01": 99 };
      const result = await service.getCount("2026-10");
      expect(sumMock).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it("returns 0 without summing when no block of the month is ready yet", async () => {
      lastReadyBlockNumber = 90;
      const result = await service.getCount("2026-10");
      expect(sumMock).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it("returns 0 without summing for a month after the last block", async () => {
      const result = await service.getCount("2027-05");
      expect(sumMock).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    describe("cache", () => {
      it("caches a month forever once its next month's first block is executed", async () => {
        await service.getCount("2026-10");
        jest.advanceTimersByTime(365 * 24 * 60 * 60 * 1000);
        const result = await service.getCount("2026-10");
        expect(sumMock).toHaveBeenCalledTimes(1);
        expect(result).toBe(1000);
      });

      it("caches the current month for 5 minutes", async () => {
        // the current month: no block of the next month yet
        await service.getCount("2026-11");
        jest.advanceTimersByTime(INCOMPLETE_MONTH_CACHE_TTL_MS - 1);
        await service.getCount("2026-11");
        expect(sumMock).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1);
        sumMock.mockResolvedValueOnce(2000);
        const result = await service.getCount("2026-11");
        expect(sumMock).toHaveBeenCalledTimes(2);
        expect(result).toBe(2000);
      });

      it("caches a past month for 5 minutes while its next month's first block is not ready", async () => {
        lastReadyBlockNumber = 199;
        lastExecutedBlockNumber = 150;
        await service.getCount("2026-10");
        jest.advanceTimersByTime(INCOMPLETE_MONTH_CACHE_TTL_MS);
        await service.getCount("2026-10");
        expect(sumMock).toHaveBeenCalledTimes(2);
      });

      it("caches a past month for 5 minutes while its next month's first block is ready but not executed", async () => {
        // a revert can still remove and reindex the month's last blocks
        lastExecutedBlockNumber = 199;
        await service.getCount("2026-10");
        jest.advanceTimersByTime(INCOMPLETE_MONTH_CACHE_TTL_MS - 1);
        await service.getCount("2026-10");
        expect(sumMock).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1);
        lastExecutedBlockNumber = 200;
        await service.getCount("2026-10");
        jest.advanceTimersByTime(365 * 24 * 60 * 60 * 1000);
        await service.getCount("2026-10");
        expect(sumMock).toHaveBeenCalledTimes(2);
      });

      it("caches each month separately", async () => {
        await service.getCount("2026-10");
        await service.getCount("2026-11");
        expect(sumMock).toHaveBeenCalledTimes(2);
      });
    });

    describe("concurrent requests", () => {
      let resolveSum: ((count: number) => void) | undefined;

      // lets the pending promises run until the sum query has started
      const waitForSumQuery = async () => {
        for (let i = 0; i < 100 && !resolveSum; i++) {
          await Promise.resolve();
        }
        expect(resolveSum).toBeDefined();
      };

      beforeEach(() => {
        resolveSum = undefined;
        sumMock.mockImplementationOnce(() => new Promise((resolve) => (resolveSum = resolve)));
      });

      it("share the same query when the month is not cached", async () => {
        const results = Promise.all([
          service.getCount("2026-11"),
          service.getCount("2026-11"),
          service.getCount("2026-11"),
        ]);
        await waitForSumQuery();
        resolveSum?.(3000);
        expect(await results).toEqual([3000, 3000, 3000]);
        expect(sumMock).toHaveBeenCalledTimes(1);
      });

      it("share the same query when the cached month has expired", async () => {
        sumMock.mockReset().mockResolvedValueOnce(1000);
        await service.getCount("2026-11");
        jest.advanceTimersByTime(INCOMPLETE_MONTH_CACHE_TTL_MS);
        resolveSum = undefined;
        sumMock.mockImplementationOnce(() => new Promise((resolve) => (resolveSum = resolve)));

        const results = Promise.all([service.getCount("2026-11"), service.getCount("2026-11")]);
        await waitForSumQuery();
        resolveSum?.(4000);
        expect(await results).toEqual([4000, 4000]);
        expect(sumMock).toHaveBeenCalledTimes(2);
      });

      it("all get the error and the next request queries again when the query fails", async () => {
        const error = new Error("query failed");
        sumMock.mockReset().mockRejectedValueOnce(error).mockResolvedValueOnce(5000);
        const results = Promise.allSettled([service.getCount("2026-11"), service.getCount("2026-11")]);
        expect(await results).toEqual([
          { status: "rejected", reason: error },
          { status: "rejected", reason: error },
        ]);

        const result = await service.getCount("2026-11");
        expect(result).toBe(5000);
        expect(sumMock).toHaveBeenCalledTimes(2);
      });
    });
  });
});
