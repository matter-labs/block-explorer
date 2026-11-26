import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { BlockService } from "../block/block.service";
import { TransactionService } from "../transaction/transaction.service";
import { MonthlyActiveAddressService } from "./monthlyActiveAddress.service";
import { MonthlyTransactionService } from "./monthlyTransaction.service";
import { StatsController } from "./stats.controller";

describe("StatsController", () => {
  let blockServiceMock: BlockService;
  let transactionServiceMock: TransactionService;
  let monthlyActiveAddressServiceMock: MonthlyActiveAddressService;
  let monthlyTransactionServiceMock: MonthlyTransactionService;
  let statsController: StatsController;

  beforeEach(async () => {
    blockServiceMock = mock<BlockService>();
    transactionServiceMock = mock<TransactionService>();
    monthlyActiveAddressServiceMock = mock<MonthlyActiveAddressService>({
      getCount: jest.fn().mockResolvedValue(0),
    });
    monthlyTransactionServiceMock = mock<MonthlyTransactionService>({
      getCount: jest.fn().mockResolvedValue(0),
    });

    const app: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [
        {
          provide: BlockService,
          useValue: blockServiceMock,
        },
        {
          provide: TransactionService,
          useValue: transactionServiceMock,
        },
        {
          provide: MonthlyActiveAddressService,
          useValue: monthlyActiveAddressServiceMock,
        },
        {
          provide: MonthlyTransactionService,
          useValue: monthlyTransactionServiceMock,
        },
      ],
    }).compile();

    statsController = app.get<StatsController>(StatsController);
  });

  describe("stats", () => {
    beforeEach(() => {
      (blockServiceMock.getLastBlockNumber as jest.Mock).mockResolvedValueOnce(10);
      (blockServiceMock.getLastVerifiedBlockNumber as jest.Mock).mockResolvedValueOnce(20);
      (transactionServiceMock.count as jest.Mock).mockResolvedValueOnce(30);
    });

    it("queries sealed blocks", async () => {
      await statsController.stats();
      expect(blockServiceMock.getLastBlockNumber).toHaveBeenCalledTimes(1);
    });

    it("queries verified blocks", async () => {
      await statsController.stats();
      expect(blockServiceMock.getLastVerifiedBlockNumber).toHaveBeenCalledTimes(1);
    });

    it("returns blockchain stats", async () => {
      const result = await statsController.stats();
      expect(result).toStrictEqual({
        lastSealedBlock: 10,
        lastVerifiedBlock: 20,
        totalTransactions: 30,
      });
    });
  });

  describe("monthlyActiveAddresses", () => {
    it("returns the count for the given month", async () => {
      (monthlyActiveAddressServiceMock.getCount as jest.Mock).mockResolvedValueOnce(12345);
      const result = await statsController.monthlyActiveAddresses("2026-05");
      expect(monthlyActiveAddressServiceMock.getCount).toHaveBeenCalledWith("2026-05");
      expect(result).toStrictEqual({ count: 12345 });
    });

    it("throws BadRequestException when month is missing", async () => {
      await expect(statsController.monthlyActiveAddresses(undefined)).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException when month is malformed", async () => {
      await expect(statsController.monthlyActiveAddresses("2026-13")).rejects.toThrow(BadRequestException);
      await expect(statsController.monthlyActiveAddresses("2026")).rejects.toThrow(BadRequestException);
      await expect(statsController.monthlyActiveAddresses("2026-05-01")).rejects.toThrow(BadRequestException);
    });
  });

  describe("monthlyTransactions", () => {
    it("returns the count for the given month", async () => {
      (monthlyTransactionServiceMock.getCount as jest.Mock).mockResolvedValueOnce(54321);
      const result = await statsController.monthlyTransactions("2026-10");
      expect(monthlyTransactionServiceMock.getCount).toHaveBeenCalledWith("2026-10");
      expect(result).toStrictEqual({ count: 54321 });
    });

    it("throws BadRequestException when month is missing", async () => {
      await expect(statsController.monthlyTransactions(undefined)).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException when month is malformed", async () => {
      await expect(statsController.monthlyTransactions("2026-13")).rejects.toThrow(BadRequestException);
      await expect(statsController.monthlyTransactions("2026")).rejects.toThrow(BadRequestException);
      await expect(statsController.monthlyTransactions("2026-10-01")).rejects.toThrow(BadRequestException);
      expect(monthlyTransactionServiceMock.getCount).not.toHaveBeenCalled();
    });
  });
});
