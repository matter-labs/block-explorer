import { Test } from "@nestjs/testing";
import { EntityManager, InsertQueryBuilder } from "typeorm";
import { mock } from "jest-mock-extended";
import { UnitOfWork } from "../unitOfWork";
import { Counter } from "../entities";
import { BaseRepository } from "./base.repository";
import { CounterStateRepository } from "./counterState.repository";
import { CounterRepository } from "./counter.repository";

describe("CounterRepository", () => {
  let repository: CounterRepository;
  let counterStateRepositoryMock: CounterStateRepository;
  let entityManagerMock: EntityManager;
  let queryBuilderMock: InsertQueryBuilder<Counter>;

  beforeEach(async () => {
    counterStateRepositoryMock = mock<CounterStateRepository>({
      findOneBy: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(null),
    });
    queryBuilderMock = mock<InsertQueryBuilder<Counter>>({
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(null),
    });
    entityManagerMock = mock<EntityManager>({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      decrement: jest.fn().mockResolvedValue(null),
    });
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        CounterRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
        {
          provide: CounterStateRepository,
          useValue: counterStateRepositoryMock,
        },
      ],
    }).compile();

    repository = app.get<CounterRepository>(CounterRepository);
  });

  it("extends BaseRepository<Counter>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Counter>);
  });

  describe("incrementCounters", () => {
    it("executes insert or increment query on on each record", async () => {
      const records = [
        {
          tableName: "transactions",
          queryString: "",
          count: 1,
        },
        {
          tableName: "transactions",
          queryString: "from=addr1",
          count: 1,
        },
      ];
      const lastProcessedRecordNumber = 100;
      await repository.incrementCounters(records, lastProcessedRecordNumber);
      expect(entityManagerMock.createQueryBuilder).toBeCalledTimes(2);
      expect(queryBuilderMock.insert).toBeCalledTimes(2);
      expect(queryBuilderMock.into).toBeCalledTimes(2);
      expect(queryBuilderMock.into).toBeCalledWith(Counter);
      expect(queryBuilderMock.values).toBeCalledWith(records[0]);
      expect(queryBuilderMock.values).toBeCalledWith(records[1]);
      expect(queryBuilderMock.onConflict).toBeCalledTimes(2);
      expect(queryBuilderMock.onConflict).toBeCalledWith(
        `("tableName", "queryString") DO UPDATE SET "count" = counters.count + EXCLUDED.count`
      );
      expect(queryBuilderMock.execute).toBeCalledTimes(2);
    });

    it("updates counter state with last processed record number", async () => {
      const records = [
        {
          tableName: "transactions",
          queryString: "",
          count: 1,
        },
      ];
      const lastProcessedRecordNumber = 100;
      await repository.incrementCounters(records, lastProcessedRecordNumber);
      expect(counterStateRepositoryMock.upsert).toBeCalledWith(
        {
          tableName: "transactions",
          lastProcessedRecordNumber: 100,
        },
        false,
        ["tableName"]
      );
    });
  });

  describe("decrementCounters", () => {
    it("decrements count for each counter", async () => {
      await repository.decrementCounters([
        {
          tableName: "transfers",
          count: 5,
          queryString: "",
        },
        {
          tableName: "transactions",
          count: 3,
          queryString: "",
        },
      ]);

      expect(entityManagerMock.decrement).toBeCalledTimes(2);
      expect(entityManagerMock.decrement).toBeCalledWith(
        Counter,
        { tableName: "transfers", queryString: "" },
        "count",
        5
      );
      expect(entityManagerMock.decrement).toBeCalledWith(
        Counter,
        { tableName: "transactions", queryString: "" },
        "count",
        3
      );
    });
  });

  describe("getLastProcessedRecordNumber", () => {
    it("returns -1 when there are no records in the DB", async () => {
      (counterStateRepositoryMock.findOneBy as jest.Mock).mockResolvedValueOnce(null);

      const result = await repository.getLastProcessedRecordNumber("transactions");
      expect(result).toBe(-1);
      expect(counterStateRepositoryMock.findOneBy).toBeCalledWith({
        tableName: "transactions",
      });
    });
    it("returns last processed record number when there is a record with specified table name in the DB", async () => {
      (counterStateRepositoryMock.findOneBy as jest.Mock).mockResolvedValueOnce({
        lastProcessedRecordNumber: 100,
      });

      const result = await repository.getLastProcessedRecordNumber("transactions");
      expect(result).toBe(100);
      expect(counterStateRepositoryMock.findOneBy).toBeCalledWith({
        tableName: "transactions",
      });
    });
  });
});
