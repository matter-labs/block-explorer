import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { BalanceRepository, deleteOldBalancesScript, deleteZeroBalancesScript } from "./balance.repository";
import { BaseRepository } from "./base.repository";
import { Balance } from "../entities";
import { UnitOfWork } from "../unitOfWork";

describe("BalanceRepository", () => {
  let repository: BalanceRepository;
  let unitOfWorkMock: UnitOfWork;

  beforeEach(async () => {
    unitOfWorkMock = mock<UnitOfWork>();

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<BalanceRepository>(BalanceRepository);
  });

  it("extends BaseRepository<Balance>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Balance>);
  });

  describe("deleteOldBalances", () => {
    const fromBlockNumber = 10;
    const toBlockNumber = 10;
    let transactionManagerMock;

    beforeEach(() => {
      transactionManagerMock = {
        query: jest.fn().mockResolvedValue([]),
      };
      (unitOfWorkMock.getTransactionManager as jest.Mock).mockReturnValue(transactionManagerMock);
    });

    it("deletes old balances by calling delete old balances SQL script", async () => {
      await repository.deleteOldBalances(fromBlockNumber, toBlockNumber);
      expect(transactionManagerMock.query).toHaveBeenCalledWith(deleteOldBalancesScript, [
        fromBlockNumber,
        toBlockNumber,
      ]);
    });
  });

  describe("deleteZeroBalances", () => {
    const fromBlockNumber = 10;
    const toBlockNumber = 10;
    let transactionManagerMock;

    beforeEach(() => {
      transactionManagerMock = {
        query: jest.fn(),
      };
      (unitOfWorkMock.getTransactionManager as jest.Mock).mockReturnValue(transactionManagerMock);
    });

    it("deletes zero balances by calling delete zero balances SQL script", async () => {
      await repository.deleteZeroBalances(fromBlockNumber, toBlockNumber);
      expect(transactionManagerMock.query).toHaveBeenCalledWith(deleteZeroBalancesScript, [
        fromBlockNumber,
        toBlockNumber,
      ]);
    });
  });

  describe("getDeleteBalancesFromBlockNumber", () => {
    let transactionManagerMock;

    beforeEach(() => {
      transactionManagerMock = {
        query: jest.fn().mockResolvedValue([{ last_value: "10" }]),
      };
      (unitOfWorkMock.getTransactionManager as jest.Mock).mockReturnValue(transactionManagerMock);
    });

    it("gets and returns fromBlockNumber for delete balances", async () => {
      const result = await repository.getDeleteBalancesFromBlockNumber();
      expect(transactionManagerMock.query).toHaveBeenCalledWith(
        `SELECT last_value FROM "deleteBalances_fromBlockNumber";`
      );
      expect(result).toBe(10);
    });
  });

  describe("setDeleteBalancesFromBlockNumber", () => {
    let transactionManagerMock;

    beforeEach(() => {
      transactionManagerMock = {
        query: jest.fn(),
      };
      (unitOfWorkMock.getTransactionManager as jest.Mock).mockReturnValue(transactionManagerMock);
    });

    it("sets fromBlockNumber for delete balances", async () => {
      await repository.setDeleteBalancesFromBlockNumber(10);
      expect(transactionManagerMock.query).toHaveBeenCalledWith(
        `SELECT setval('"deleteBalances_fromBlockNumber"', $1, false);`,
        [10]
      );
    });
  });
});
