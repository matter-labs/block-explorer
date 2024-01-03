import { mock } from "jest-mock-extended";
import { Repository, MoreThanOrEqual, MoreThan, Between } from "typeorm";
import { CounterRepository } from "../repositories";
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
  let unitOfWorkMock: UnitOfWork;
  let waitForTransactionExecutionMock: jest.Mock;
  let counterProcessor: CounterProcessor<Transaction>;

  beforeEach(() => {
    repositoryMock = mock<Repository<Transaction>>({
      find: jest.fn().mockResolvedValue([]),
    });
    counterRepositoryMock = mock<CounterRepository>({
      incrementCounters: jest.fn().mockResolvedValue(null),
      decrementCounters: jest.fn().mockResolvedValue(null),
      getLastProcessedRecordNumber: jest.fn().mockResolvedValue(-1),
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
      counterRepositoryMock
    );
  });

  describe("processNextRecordsBatch", () => {
    it("fetches the next records batch from the DB", async () => {
      await counterProcessor.processNextRecordsBatch();
      expect(repositoryMock.find).toBeCalledWith({
        where: {
          number: MoreThanOrEqual(0),
        },
        select: ["blockNumber", "from", "to", "number"],
        take: 5,
        order: {
          number: "ASC",
        },
      });
    });

    it("returns false when the next records batch from the DB is empty", async () => {
      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeFalsy();
    });

    it("returns false and logs error when repository find call fails", async () => {
      const error = new Error("error");
      jest.spyOn(repositoryMock, "find").mockRejectedValueOnce(error);

      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeFalsy();
      expect(mockLoggerError).toBeCalledWith({
        message: "Error while processing next records to update counters",
        stack: error.stack,
        tableName: "transactions",
        startingFromNumber: 0,
      });
    });

    it("logs error when last processed record number from DB query fails", async () => {
      const error = new Error("error");
      (counterRepositoryMock.getLastProcessedRecordNumber as jest.Mock).mockRejectedValueOnce(error);

      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeFalsy();
      expect(mockLoggerError).toBeCalledWith({
        message: "Error while processing next records to update counters",
        stack: error.stack,
        tableName: "transactions",
        startingFromNumber: null,
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
          counterRepositoryMock
        );
        const records = [
          {
            number: 1,
            from: "addr1",
          },
          {
            number: 2,
            from: "addr2",
          },
          {
            number: 3,
            from: "addr2",
            to: "addr3",
          },
        ];
        (repositoryMock.find as jest.Mock).mockResolvedValueOnce(records);
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
          records[records.length - 1].number
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
        (repositoryMock.find as jest.Mock).mockResolvedValueOnce(records);
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
          records[records.length - 1].number
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
        (repositoryMock.find as jest.Mock).mockResolvedValueOnce(records);
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
          records[records.length - 1].number
        );
      });
    });

    it("returns true when the next records batch size is not greater than actual number of fetched records", async () => {
      (repositoryMock.find as jest.Mock).mockResolvedValueOnce([
        {
          number: 1,
        },
        {
          number: 2,
        },
        {
          number: 3,
        },
        {
          number: 4,
        },
        {
          number: 5,
        },
      ]);

      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeTruthy();
    });

    it("returns false when next records batch size is grater than actual number of fetched records", async () => {
      (repositoryMock.find as jest.Mock).mockResolvedValueOnce([
        {
          number: 1,
        },
        {
          number: 2,
        },
        {
          number: 3,
        },
        {
          number: 4,
        },
      ]);

      const result = await counterProcessor.processNextRecordsBatch();
      expect(result).toBeFalsy();
    });

    it("reuses lastProcessedRecordNumber on next call if present", async () => {
      await counterProcessor.processNextRecordsBatch();
      await counterProcessor.processNextRecordsBatch();
      await counterProcessor.processNextRecordsBatch();
      expect(counterRepositoryMock.getLastProcessedRecordNumber).toBeCalledTimes(1);
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
        jest.spyOn(counterRepositoryMock, "getLastProcessedRecordNumber").mockResolvedValue(200);
      });

      describe("and there are no changes processed after the last correct block", () => {
        it("does not revert counters", async () => {
          await counterProcessor.revert(100);
          expect(counterRepositoryMock.decrementCounters).not.toBeCalled();
        });
      });

      describe("and there are some changes processed after the last correct block", () => {
        it("iteratively fetches records added after the last correct block and reverts all the counters changes", async () => {
          const recordsBatch1 = [
            { number: 187, blockNumber: 10, from: "from" },
            { number: 188, blockNumber: 10, from: "from" },
            { number: 189, blockNumber: 10, from: "from" },
            { number: 190, blockNumber: 10, from: "from" },
            { number: 191, blockNumber: 10, from: "from" },
          ];
          const recordsBatch2 = [
            { number: 192, blockNumber: 10, to: "to" },
            { number: 193, blockNumber: 10, to: "to" },
            { number: 194, blockNumber: 10, to: "to" },
            { number: 195, blockNumber: 10, to: "to" },
            { number: 196, blockNumber: 10, to: "to" },
          ];
          const recordsBatch3 = [
            { number: 197, blockNumber: 10 },
            { number: 198, blockNumber: 10 },
            { number: 199, blockNumber: 10 },
            { number: 200, blockNumber: 10 },
          ];
          (repositoryMock.find as jest.Mock)
            .mockResolvedValueOnce(recordsBatch1)
            .mockResolvedValueOnce(recordsBatch2)
            .mockResolvedValueOnce(recordsBatch3);

          await counterProcessor.revert(100);

          expect(repositoryMock.find).toBeCalledTimes(3);
          expect(counterRepositoryMock.decrementCounters).toBeCalledTimes(3);

          expect(repositoryMock.find).toBeCalledWith({
            where: {
              blockNumber: MoreThan(100),
              number: Between(0, 200),
            },
            select: ["blockNumber", "from", "to", "number"],
            take: 5,
            order: {
              number: "ASC",
            },
          });
          expect(counterRepositoryMock.decrementCounters).toBeCalledWith([
            {
              count: 5,
              tableName: "transactions",
              queryString: "",
            },
            {
              count: 5,
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=from",
            },
            {
              count: 5,
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=undefined",
            },
          ]);

          expect(repositoryMock.find).toBeCalledWith({
            where: {
              blockNumber: MoreThan(100),
              number: Between(192, 200),
            },
            select: ["blockNumber", "from", "to", "number"],
            take: 5,
            order: {
              number: "ASC",
            },
          });
          expect(counterRepositoryMock.decrementCounters).toBeCalledWith([
            {
              count: 5,
              tableName: "transactions",
              queryString: "",
            },
            {
              count: 5,
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=undefined",
            },
            {
              count: 5,
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=to",
            },
          ]);

          expect(repositoryMock.find).toBeCalledWith({
            where: {
              blockNumber: MoreThan(100),
              number: Between(197, 200),
            },
            select: ["blockNumber", "from", "to", "number"],
            take: 5,
            order: {
              number: "ASC",
            },
          });
          expect(counterRepositoryMock.decrementCounters).toBeCalledWith([
            {
              count: 4,
              tableName: "transactions",
              queryString: "",
            },
            {
              count: 4,
              tableName: "transactions",
              queryString: "blockNumber=10&from%7Cto=undefined",
            },
          ]);
        });
      });
    });
  });
});
