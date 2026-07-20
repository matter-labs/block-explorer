import { mock } from "jest-mock-extended";
import { Repository } from "typeorm";
import { CounterRepository, IndexerStateRepository } from "../repositories";
import { Transaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { CounterProcessor } from "./counter.processor";

const mockLoggerError = jest.fn();

jest.mock("@nestjs/common", () => ({
  ...jest.requireActual("@nestjs/common"),
  Logger: jest.fn().mockReturnValue({
    debug: jest.fn(),
    log: jest.fn(),
    error: (...args: any[]) => mockLoggerError(...args),
  }),
}));

describe("CounterProcessor", () => {
  let repositoryMock: Repository<Transaction>;
  let counterRepositoryMock: CounterRepository;
  let indexerStateRepositoryMock: IndexerStateRepository;
  let unitOfWorkMock: UnitOfWork;
  let waitForTransactionExecutionMock: jest.Mock;
  let counterProcessor: CounterProcessor<Transaction>;
  let queryBuilderMock: {
    select: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    limit: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(() => {
    queryBuilderMock = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    repositoryMock = mock<Repository<Transaction>>({
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    });
    counterRepositoryMock = mock<CounterRepository>({
      incrementCounters: jest.fn().mockResolvedValue(null),
      decrementCounters: jest.fn().mockResolvedValue(null),
      getLastProcessedRecordNumber: jest.fn().mockResolvedValue(-1),
      getLastProcessedCursor: jest
        .fn()
        .mockResolvedValue({ lastProcessedRecordNumber: -1, lastProcessedBlockNumber: -1 }),
    });
    indexerStateRepositoryMock = mock<IndexerStateRepository>({
      getLastReadyBlockNumber: jest.fn().mockResolvedValue(1_000_000),
    });
    waitForTransactionExecutionMock = jest.fn();
    unitOfWorkMock = mock<UnitOfWork>({
      useTransaction: jest.fn().mockImplementation((fn) => ({
        waitForExecution: waitForTransactionExecutionMock.mockResolvedValue(fn()),
        commit: jest.fn().mockResolvedValue(null),
        ensureRollbackIfNotCommitted: jest.fn().mockResolvedValue(null),
      })),
    });
    counterProcessor = new CounterProcessor<Transaction>(
      Transaction,
      [["blockNumber", "from|to"]],
      5,
      unitOfWorkMock,
      repositoryMock,
      counterRepositoryMock,
      indexerStateRepositoryMock
    );
  });

  describe("processNextRecordsBatch", () => {
    it("fetches the next records batch from the DB with tuple cursor + watermark filter", async () => {
      await counterProcessor.processNextRecordsBatch();
      expect(repositoryMock.createQueryBuilder).toBeCalledWith("record");
      expect(queryBuilderMock.select).toBeCalledWith([
        "record.blockNumber",
        "record.from",
        "record.to",
        "record.number",
      ]);
      expect(queryBuilderMock.where).toBeCalledWith(
        `(record."blockNumber", record."number") > (:lastBlockNumber, :lastRecordNumber)`,
        { lastBlockNumber: -1, lastRecordNumber: -1 }
      );
      expect(queryBuilderMock.andWhere).toBeCalledWith(`record."blockNumber" <= :lastReadyBlockNumber`, {
        lastReadyBlockNumber: 1_000_000,
      });
      expect(queryBuilderMock.orderBy).toBeCalledWith(`record."blockNumber"`, "ASC");
      expect(queryBuilderMock.addOrderBy).toBeCalledWith(`record."number"`, "ASC");
      expect(queryBuilderMock.limit).toBeCalledWith(5);
      expect(queryBuilderMock.getMany).toBeCalledTimes(1);
    });

    it("returns false when the next records batch from the DB is empty", async () => {
      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeFalsy();
    });

    it("returns false and logs error when repository query fails", async () => {
      const error = new Error("error");
      queryBuilderMock.getMany.mockRejectedValueOnce(error);

      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeFalsy();
      expect(mockLoggerError).toBeCalledWith({
        message: "Error while processing next records to update counters",
        stack: error.stack,
        tableName: "transactions",
        startingFromNumber: 0,
        startingFromBlockNumber: 0,
      });
    });

    it("logs error when last processed cursor from DB query fails", async () => {
      const error = new Error("error");
      (counterRepositoryMock.getLastProcessedCursor as jest.Mock).mockRejectedValueOnce(error);

      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeFalsy();
      expect(mockLoggerError).toBeCalledWith({
        message: "Error while processing next records to update counters",
        stack: error.stack,
        tableName: "transactions",
        startingFromNumber: null,
        startingFromBlockNumber: null,
      });
    });

    describe("when criteria list is empty", () => {
      it("calculates only total count and updates the counter in DB", async () => {
        const counterProcessorWithNoCriteria = new CounterProcessor<Transaction>(
          Transaction,
          [],
          5,
          unitOfWorkMock,
          repositoryMock,
          counterRepositoryMock,
          indexerStateRepositoryMock
        );
        const records = [
          {
            number: 1,
            blockNumber: 5,
            from: "addr1",
          },
          {
            number: 2,
            blockNumber: 5,
            from: "addr2",
          },
          {
            number: 3,
            blockNumber: 6,
            from: "addr2",
            to: "addr3",
          },
        ];
        queryBuilderMock.getMany.mockResolvedValueOnce(records);
        await counterProcessorWithNoCriteria.processNextRecordsBatch();

        expect(unitOfWorkMock.useTransaction).toBeCalledTimes(1);
        expect(waitForTransactionExecutionMock).toBeCalledTimes(1);
        expect(counterRepositoryMock.incrementCounters).toBeCalledTimes(1);
        expect(counterRepositoryMock.incrementCounters).toBeCalledWith(
          [
            {
              tableName: "transactions",
              queryString: "",
              count: records.length,
            },
          ],
          records[records.length - 1].number,
          records[records.length - 1].blockNumber
        );
      });
    });

    describe("when criteria list is not empty", () => {
      it("calculates counters for the criteria list [from,to] and updates the counters in DB", async () => {
        const records = [
          {
            number: 1,
            blockNumber: 10,
            from: "addr1",
            to: "addr3",
          },
          {
            number: 2,
            blockNumber: 10,
            from: "addr2",
            to: "addr3",
          },
          {
            number: 3,
            blockNumber: 9,
            from: "addr2",
            to: "addr3",
          },
          {
            number: 4,
            blockNumber: 9,
            from: "addr4",
            to: "addr4",
          },
        ];
        queryBuilderMock.getMany.mockResolvedValueOnce(records);
        await counterProcessor.processNextRecordsBatch();

        expect(unitOfWorkMock.useTransaction).toBeCalledTimes(1);
        expect(waitForTransactionExecutionMock).toBeCalledTimes(1);
        expect(counterRepositoryMock.incrementCounters).toBeCalledTimes(1);
        expect(counterRepositoryMock.incrementCounters).toBeCalledWith(
          [
            {
              tableName: "transactions",
              queryString: "",
              count: records.length,
            },
            {
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=addr1",
              count: 1,
            },
            {
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=addr3",
              count: 2,
            },
            {
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=addr2",
              count: 1,
            },
            {
              tableName: "transactions",
              queryString: "blockNumber=9&from%7Cto=addr2",
              count: 1,
            },
            {
              tableName: "transactions",
              queryString: "blockNumber=9&from%7Cto=addr3",
              count: 1,
            },
            {
              tableName: "transactions",
              queryString: "blockNumber=9&from%7Cto=addr4",
              count: 1,
            },
          ],
          records[records.length - 1].number,
          records[records.length - 1].blockNumber
        );
      });
    });

    describe("when there are records with null values in criteria fields", () => {
      it("calculates counters for nullable criteria and updates the counters in DB", async () => {
        const records = [
          {
            number: 1,
            blockNumber: 10,
            from: null,
            to: "addr1",
          },
          {
            number: 2,
            blockNumber: 10,
            from: "addr2",
            to: null,
          },
        ];
        queryBuilderMock.getMany.mockResolvedValueOnce(records);
        await counterProcessor.processNextRecordsBatch();

        expect(unitOfWorkMock.useTransaction).toBeCalledTimes(1);
        expect(waitForTransactionExecutionMock).toBeCalledTimes(1);
        expect(counterRepositoryMock.incrementCounters).toBeCalledTimes(1);
        expect(counterRepositoryMock.incrementCounters).toBeCalledWith(
          [
            {
              tableName: "transactions",
              queryString: "",
              count: records.length,
            },
            {
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=null",
              count: 2,
            },
            {
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=addr1",
              count: 1,
            },
            {
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=addr2",
              count: 1,
            },
          ],
          records[records.length - 1].number,
          records[records.length - 1].blockNumber
        );
      });
    });

    it("returns true when the next records batch size is not greater than actual number of fetched records", async () => {
      queryBuilderMock.getMany.mockResolvedValueOnce([
        { number: 1 },
        { number: 2 },
        { number: 3 },
        { number: 4 },
        { number: 5 },
      ]);

      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeTruthy();
    });

    it("returns false when next records batch size is grater than actual number of fetched records", async () => {
      queryBuilderMock.getMany.mockResolvedValueOnce([{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }]);

      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeFalsy();
    });

    it("reuses last processed cursor on next call if present", async () => {
      await counterProcessor.processNextRecordsBatch();
      await counterProcessor.processNextRecordsBatch();
      await counterProcessor.processNextRecordsBatch();
      expect(counterRepositoryMock.getLastProcessedCursor).toBeCalledTimes(1);
    });
  });

  describe("revert", () => {
    describe("when there are no processed records yet", () => {
      it("does not revert counters", async () => {
        await counterProcessor.revert(100);
        expect(counterRepositoryMock.decrementCounters).not.toBeCalled();
      });
    });

    describe("when there are processed records", () => {
      beforeEach(() => {
        (counterRepositoryMock.getLastProcessedCursor as jest.Mock).mockResolvedValue({
          lastProcessedRecordNumber: 200,
          lastProcessedBlockNumber: 10,
        });
      });

      describe("and there are no changes processed after the last correct block", () => {
        it("does not revert counters", async () => {
          await counterProcessor.revert(100);
          expect(counterRepositoryMock.decrementCounters).not.toBeCalled();
        });
      });

      describe("and there are some changes processed after the last correct block", () => {
        it("iteratively fetches records in DESC order and reverts all the counters changes", async () => {
          // DESC order: newest (highest blockNumber, then highest number) first
          const recordsBatch1 = [
            { number: 200, blockNumber: 10 },
            { number: 199, blockNumber: 10 },
            { number: 198, blockNumber: 10 },
            { number: 197, blockNumber: 10 },
            { number: 196, blockNumber: 10, to: "to" },
          ];
          const recordsBatch2 = [
            { number: 195, blockNumber: 10, to: "to" },
            { number: 194, blockNumber: 10, to: "to" },
            { number: 193, blockNumber: 10, to: "to" },
            { number: 192, blockNumber: 10, to: "to" },
            { number: 191, blockNumber: 10, from: "from" },
          ];
          const recordsBatch3 = [
            { number: 190, blockNumber: 10, from: "from" },
            { number: 189, blockNumber: 10, from: "from" },
            { number: 188, blockNumber: 10, from: "from" },
            { number: 187, blockNumber: 10, from: "from" },
          ];
          queryBuilderMock.getMany
            .mockResolvedValueOnce(recordsBatch1)
            .mockResolvedValueOnce(recordsBatch2)
            .mockResolvedValueOnce(recordsBatch3);

          await counterProcessor.revert(100);

          expect(counterRepositoryMock.decrementCounters).toBeCalledTimes(3);
          expect(counterRepositoryMock.decrementCounters).toHaveBeenNthCalledWith(
            1,
            expect.any(Array),
            195, // 196 - 1
            10
          );
          expect(counterRepositoryMock.decrementCounters).toHaveBeenNthCalledWith(
            2,
            expect.any(Array),
            190, // 191 - 1
            10
          );
          expect(counterRepositoryMock.decrementCounters).toHaveBeenNthCalledWith(
            3,
            expect.any(Array),
            186, // 187 - 1
            10
          );
        });
      });
    });
  });
});
