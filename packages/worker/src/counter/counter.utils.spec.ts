import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Test, TestingModule } from "@nestjs/testing";
import { UnitOfWork } from "../unitOfWork";
import { Transaction } from "../entities";
import { CounterRepository, TransactionRepository } from "../repositories";
import { getQueryString, calculateCounters, getCounterWorkerProvider } from "./counter.utils";

describe("getQueryString", () => {
  it("returns sorted query string from filters object", () => {
    const filters = {
      to: "123",
      from: "321",
      nullable: null,
      undefined: undefined,
    };
    expect(getQueryString(filters)).toBe("from=321&nullable=null&to=123&undefined=undefined");
  });
});

describe("calculateCounters", () => {
  it("calculates all the counters for provided criteria list", () => {
    const records = [
      {
        number: 1,
        blockNumber: 10,
        from: "addr1",
        to: "addr2",
      },
      {
        number: 2,
        blockNumber: 10,
        from: "addr3",
        to: "addr1",
      },
      {
        number: 3,
        blockNumber: 9,
        from: "addr1",
        to: "addr2",
      },
      {
        number: 4,
        blockNumber: 9,
        from: null,
        to: null,
      },
    ];

    expect(calculateCounters("someTableName", records, [["blockNumber", "from|to"]])).toEqual([
      {
        tableName: "someTableName",
        queryString: "",
        count: records.length,
      },
      {
        tableName: "someTableName",
        queryString: "blockNumber=10&from%7Cto=addr1",
        count: 2,
      },
      {
        tableName: "someTableName",
        queryString: "blockNumber=10&from%7Cto=addr2",
        count: 1,
      },
      {
        tableName: "someTableName",
        queryString: "blockNumber=10&from%7Cto=addr3",
        count: 1,
      },
      {
        tableName: "someTableName",
        queryString: "blockNumber=9&from%7Cto=addr1",
        count: 1,
      },
      {
        tableName: "someTableName",
        queryString: "blockNumber=9&from%7Cto=addr2",
        count: 1,
      },
      {
        tableName: "someTableName",
        queryString: "blockNumber=9&from%7Cto=null",
        count: 1,
      },
    ]);
  });
});

describe("getCounterWorkerProvider", () => {
  it("returns provider for counter worker provided type", async () => {
    const provider = getCounterWorkerProvider("CounterWorker<Transaction>", Transaction, [
      ["from|to"],
      ["blockNumber"],
    ]);
    const configMock = mock<ConfigService>({
      get: jest.fn().mockReturnValueOnce(10).mockReturnValueOnce(1000),
    });
    const unitOfWorkMock = mock<UnitOfWork>();
    const transactionRepositoryMock = mock<TransactionRepository>();
    const counterRepositoryMock = mock<CounterRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionRepositoryMock,
        },
        {
          provide: ConfigService,
          useValue: configMock,
        },
        {
          provide: CounterRepository,
          useValue: counterRepositoryMock,
        },
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
        provider,
      ],
    }).compile();
    const transactionCounterWorker = module.get("CounterWorker<Transaction>");

    expect(transactionCounterWorker).toMatchObject({
      counterProcessor: {
        entityClass: Transaction,
        criteriaList: [["from|to"], ["blockNumber"]],
        recordsBatchSize: 10,
      },
      pollingInterval: 1000,
    });
  });
});
