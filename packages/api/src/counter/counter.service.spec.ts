import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Transaction } from "../transaction/entities/transaction.entity";
import { Batch } from "../batch/batch.entity";
import { Counter } from "./counter.entity";
import { CounterService } from "./counter.service";

describe("CounterService", () => {
  let service: CounterService;
  let repositoryMock: Repository<Counter>;

  beforeEach(async () => {
    repositoryMock = mock<Repository<Counter>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CounterService,
        {
          provide: getRepositoryToken(Counter),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get(CounterService);
  });

  describe("count", () => {
    it("throws an error when table is not supported", async () => {
      const expectedError = new Error('Counter for table batches and criteria "" is not supported');
      await expect(service.count(Batch)).rejects.toThrowError(expectedError);
    });

    it("throws an error when specified criteria is not supported", async () => {
      const expectedError = new Error('Counter for table transactions and criteria "l1BatchNumber=1" is not supported');
      await expect(service.count(Transaction, { l1BatchNumber: 1 })).rejects.toThrowError(expectedError);
    });

    it("returns 0 if there is no counter found in the DB", async () => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.count(Transaction);
      expect(result).toBe(0);
    });

    it("returns count if there is a counter found in the DB", async () => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValue({ count: 100 } as Counter);
      const result = await service.count(Transaction);
      expect(result).toBe(100);
    });

    describe("when no counter criteria is specified", () => {
      it("calls repository with empty query string", async () => {
        (repositoryMock.findOne as jest.Mock).mockResolvedValue({ count: 100 } as Counter);
        await service.count(Transaction);
        expect(repositoryMock.findOne).toBeCalledWith({
          where: {
            tableName: "transactions",
            queryString: "",
          },
          select: ["count"],
        });
      });
    });

    describe("when counter criteria is specified", () => {
      it("calls repository with where criteria transformed to query string", async () => {
        (repositoryMock.findOne as jest.Mock).mockResolvedValue({ count: 100 } as Counter);
        await service.count(Transaction, { "from|to": "addr1" });
        expect(repositoryMock.findOne).toBeCalledWith({
          where: {
            tableName: "transactions",
            queryString: "from%7Cto=addr1",
          },
          select: ["count"],
        });
      });
    });
  });
});
