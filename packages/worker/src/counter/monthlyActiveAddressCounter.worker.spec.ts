import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { CounterRepository, IndexerStateRepository, MonthlyActiveAddressRepository } from "../repositories";
import { MonthlyActiveAddressCounterWorker } from "./monthlyActiveAddressCounter.worker";

jest.mock("../utils/waitFor", () => ({ __esModule: true, default: jest.fn().mockResolvedValue(null) }));

jest.mock("@nestjs/common", () => ({
  ...jest.requireActual("@nestjs/common"),
  Logger: jest.fn().mockReturnValue({
    debug: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  }),
}));

describe("MonthlyActiveAddressCounterWorker", () => {
  let monthlyActiveAddressRepositoryMock: MonthlyActiveAddressRepository;
  let counterRepositoryMock: CounterRepository;
  let indexerStateRepositoryMock: IndexerStateRepository;
  let configServiceMock: ConfigService;
  let worker: MonthlyActiveAddressCounterWorker;

  beforeEach(() => {
    monthlyActiveAddressRepositoryMock = mock<MonthlyActiveAddressRepository>({
      processTransactionsBatch: jest
        .fn()
        .mockResolvedValue({ processed: 0, newLastBlockNumber: 0, newLastRecordNumber: 0 }),
      revertAboveBlockNumber: jest.fn().mockResolvedValue(null),
    });
    counterRepositoryMock = mock<CounterRepository>({
      getLastProcessedCursor: jest
        .fn()
        .mockResolvedValue({ lastProcessedRecordNumber: -1, lastProcessedBlockNumber: -1 }),
    });
    indexerStateRepositoryMock = mock<IndexerStateRepository>({
      getLastReadyBlockNumber: jest.fn().mockResolvedValue(1_000_000),
    });
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => {
        if (key === "counters.recordsBatchSize") return 5;
        if (key === "counters.updateInterval") return 30_000;
        return undefined;
      }),
    });

    worker = new MonthlyActiveAddressCounterWorker(
      monthlyActiveAddressRepositoryMock,
      counterRepositoryMock,
      indexerStateRepositoryMock,
      configServiceMock
    );
  });

  describe("revert", () => {
    it("delegates to the repository with the tableName", async () => {
      await worker.revert(123);
      expect(monthlyActiveAddressRepositoryMock.revertAboveBlockNumber).toHaveBeenCalledWith(
        123,
        "monthlyActiveAddresses"
      );
    });
  });

  describe("runProcess", () => {
    const callRunProcess = () => (worker as unknown as { runProcess: () => Promise<void> }).runProcess();

    it("re-invokes runProcess while the batch was full, then stops", async () => {
      (monthlyActiveAddressRepositoryMock.processTransactionsBatch as jest.Mock)
        .mockResolvedValueOnce({ processed: 5, newLastBlockNumber: 10, newLastRecordNumber: 20 })
        // simulate stop on the second iteration so the loop exits after the worker re-enters runProcess
        .mockImplementationOnce(async () => {
          (worker as unknown as { currentProcessPromise: null }).currentProcessPromise = null;
          return { processed: 0, newLastBlockNumber: 11, newLastRecordNumber: 21 };
        });

      (worker as unknown as { currentProcessPromise: unknown }).currentProcessPromise = Promise.resolve();
      await callRunProcess();
      expect(monthlyActiveAddressRepositoryMock.processTransactionsBatch).toHaveBeenCalledTimes(2);
    });
  });

  describe("processing batches", () => {
    const callProcessNextRecordsBatch = () =>
      (worker as unknown as { processNextRecordsBatch: () => Promise<boolean> }).processNextRecordsBatch();

    it("reads the cursor and lastReadyBlockNumber, then calls processTransactionsBatch with both", async () => {
      (counterRepositoryMock.getLastProcessedCursor as jest.Mock).mockResolvedValueOnce({
        lastProcessedRecordNumber: 42,
        lastProcessedBlockNumber: 99,
      });

      await callProcessNextRecordsBatch();

      expect(monthlyActiveAddressRepositoryMock.processTransactionsBatch).toHaveBeenCalledWith(
        { lastBlockNumber: 99, lastRecordNumber: 42 },
        1_000_000,
        5,
        "monthlyActiveAddresses"
      );
    });

    it("returns true (has more) when the batch hit the configured size", async () => {
      (monthlyActiveAddressRepositoryMock.processTransactionsBatch as jest.Mock).mockResolvedValueOnce({
        processed: 5,
        newLastBlockNumber: 100,
        newLastRecordNumber: 200,
      });
      expect(await callProcessNextRecordsBatch()).toBe(true);
    });

    it("returns false when the batch was smaller than the configured size", async () => {
      (monthlyActiveAddressRepositoryMock.processTransactionsBatch as jest.Mock).mockResolvedValueOnce({
        processed: 3,
        newLastBlockNumber: 100,
        newLastRecordNumber: 200,
      });
      expect(await callProcessNextRecordsBatch()).toBe(false);
    });

    it("returns false on repository error and does not throw", async () => {
      (monthlyActiveAddressRepositoryMock.processTransactionsBatch as jest.Mock).mockRejectedValueOnce(
        new Error("boom")
      );
      expect(await callProcessNextRecordsBatch()).toBe(false);
    });
  });
});
