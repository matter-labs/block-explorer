import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { NotFoundException } from "@nestjs/common";
import { Pagination } from "nestjs-typeorm-paginate";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";
import { TransferService } from "../transfer/transfer.service";
import { LogService } from "../log/log.service";
import { Transaction } from "./entities/transaction.entity";
import { Transfer } from "../transfer/transfer.entity";
import { Log } from "../log/log.entity";
import { PagingOptionsWithMaxItemsLimitDto } from "../common/dtos";
import { FilterTransactionsOptionsDto } from "./dtos/filterTransactionsOptions.dto";

jest.mock("../common/utils", () => ({
  buildDateFilter: jest.fn().mockReturnValue({ timestamp: "timestamp" }),
}));

describe("TransactionController", () => {
  const transactionHash = "transactionHash";
  const pagingOptions: PagingOptionsWithMaxItemsLimitDto = { limit: 10, page: 2, maxLimit: 10000 };
  let controller: TransactionController;
  let serviceMock: TransactionService;
  let transferServiceMock: TransferService;
  let logServiceMock: LogService;
  let transaction;

  beforeEach(async () => {
    serviceMock = mock<TransactionService>();
    transferServiceMock = mock<TransferService>();
    logServiceMock = mock<LogService>();

    transaction = {
      hash: transactionHash,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: serviceMock,
        },
        {
          provide: TransferService,
          useValue: transferServiceMock,
        },
        {
          provide: LogService,
          useValue: logServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  describe("getTransactions", () => {
    const transactions = mock<Pagination<Transaction>>();
    const filterTransactionsOptions: FilterTransactionsOptionsDto = {
      blockNumber: 10,
      address: "address",
    };
    const listFilterOptions = {
      fromDate: "2023-02-08T15:34:46.251Z",
      toDate: "2023-02-08T17:34:46.251Z",
    };
    const pagingOptions: PagingOptionsWithMaxItemsLimitDto = { limit: 10, page: 2, maxLimit: 10000 };

    beforeEach(() => {
      (serviceMock.findAll as jest.Mock).mockResolvedValueOnce(transactions);
    });

    it("queries transactions with the specified options", async () => {
      await controller.getTransactions(filterTransactionsOptions, listFilterOptions, pagingOptions);
      expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
      expect(serviceMock.findAll).toHaveBeenCalledWith(
        {
          ...filterTransactionsOptions,
          timestamp: "timestamp",
        },
        {
          filterOptions: { ...filterTransactionsOptions, ...listFilterOptions },
          ...pagingOptions,
          route: "transactions",
        }
      );
    });

    it("returns the transactions", async () => {
      const result = await controller.getTransactions(filterTransactionsOptions, listFilterOptions, pagingOptions);
      expect(result).toBe(transactions);
    });
  });

  describe("getTransaction", () => {
    describe("when transaction exists", () => {
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValue(transaction);
      });

      it("queries transactions by specified transaction hash", async () => {
        await controller.getTransaction(transactionHash);
        expect(serviceMock.findOne).toHaveBeenCalledTimes(1);
        expect(serviceMock.findOne).toHaveBeenCalledWith(transactionHash);
      });

      it("returns the transaction", async () => {
        const result = await controller.getTransaction(transactionHash);
        expect(result).toBe(transaction);
      });
    });

    describe("when transaction does not exist", () => {
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValueOnce(null);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getTransaction(transactionHash);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });

  describe("getTransactionTransfers", () => {
    const transactionTransfers = mock<Pagination<Transfer>>();
    describe("when transaction exists", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(true);
        (transferServiceMock.findAll as jest.Mock).mockResolvedValueOnce(transactionTransfers);
      });

      it("queries transfers with the specified options", async () => {
        await controller.getTransactionTransfers(transactionHash, pagingOptions);
        expect(transferServiceMock.findAll).toHaveBeenCalledTimes(1);
        expect(transferServiceMock.findAll).toHaveBeenCalledWith(
          { transactionHash },
          {
            ...pagingOptions,
            route: `transactions/${transactionHash}/transfers`,
          }
        );
      });

      it("returns transaction transfers", async () => {
        const result = await controller.getTransactionTransfers(transactionHash, pagingOptions);
        expect(result).toBe(transactionTransfers);
      });
    });

    describe("when transaction does not exist", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(false);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getTransactionTransfers(transactionHash, pagingOptions);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });

  describe("getTransactionLogs", () => {
    const transactionLogs = mock<Pagination<Log>>();
    describe("when transaction exists", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(true);
        (logServiceMock.findAll as jest.Mock).mockResolvedValueOnce(transactionLogs);
      });

      it("queries logs with the specified options", async () => {
        await controller.getTransactionLogs(transactionHash, pagingOptions);
        expect(logServiceMock.findAll).toHaveBeenCalledTimes(1);
        expect(logServiceMock.findAll).toHaveBeenCalledWith(
          { transactionHash },
          {
            ...pagingOptions,
            route: `transactions/${transactionHash}/logs`,
          }
        );
      });

      it("returns transaction logs", async () => {
        const result = await controller.getTransactionLogs(transactionHash, pagingOptions);
        expect(result).toBe(transactionLogs);
      });
    });

    describe("when transaction does not exist", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(false);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getTransactionLogs(transactionHash, pagingOptions);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });
});
