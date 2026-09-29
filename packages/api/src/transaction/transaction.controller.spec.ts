import { Test, TestingModule } from "@nestjs/testing";
import { mock, MockProxy } from "jest-mock-extended";
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
import { UserParam } from "../user/user.decorator";
import clearAllMocks = jest.clearAllMocks;

jest.mock("../common/utils", () => ({
  buildDateFilter: jest.fn().mockReturnValue({ timestamp: "timestamp" }),
  isAddressEqual: jest.fn(),
}));

describe("TransactionController", () => {
  const transactionHash = "transactionHash";
  const pagingOptions: PagingOptionsWithMaxItemsLimitDto = { limit: 10, page: 2, maxLimit: 10000 };
  let controller: TransactionController;
  let serviceMock: TransactionService;
  let transferServiceMock: TransferService;
  let logServiceMock: LogService;
  let transaction: { hash: string };

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
      await controller.getTransactions(filterTransactionsOptions, listFilterOptions, pagingOptions, null);
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
      const result = await controller.getTransactions(
        filterTransactionsOptions,
        listFilterOptions,
        pagingOptions,
        null
      );
      expect(result).toBe(transactions);
    });

    describe("when user is provided", () => {
      let user: MockProxy<UserParam>;
      const mockUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const firstTransaction = { hash: "0x01" } as Transaction;
      const secondTransaction = { hash: "0x02" } as Transaction;
      const userTransactions = new Pagination(
        [firstTransaction, secondTransaction],
        { itemCount: 2, itemsPerPage: 10, currentPage: 2 },
        { first: "first", previous: "previous", next: "next", last: "last" }
      );
      beforeEach(() => {
        user = mock<UserParam>({ address: mockUser });
        (serviceMock.findAll as jest.Mock).mockReset();
        (serviceMock.findAll as jest.Mock).mockResolvedValue(userTransactions);
        (serviceMock.redactForUser as jest.Mock).mockImplementation((transaction) => ({ ...transaction, data: "0x" }));
      });

      it("returns the transactions redacted for the user", async () => {
        const result = await controller.getTransactions(
          filterTransactionsOptions,
          listFilterOptions,
          pagingOptions,
          user
        );
        expect(serviceMock.redactForUser).toHaveBeenCalledWith(firstTransaction, user);
        expect(result).toEqual({
          items: [
            { hash: "0x01", data: "0x" },
            { hash: "0x02", data: "0x" },
          ],
          meta: userTransactions.meta,
          links: userTransactions.links,
        });
      });

      it("filters by own address when no address is provided", async () => {
        const filterOptionsWithoutAddress = { blockNumber: 10 };
        await controller.getTransactions(filterOptionsWithoutAddress, listFilterOptions, pagingOptions, user);
        expect(serviceMock.findAll).toHaveBeenCalledWith(
          {
            ...filterOptionsWithoutAddress,
            timestamp: "timestamp",
            filterAddressInLogTopics: true,
            address: mockUser,
          },
          {
            filterOptions: { ...filterOptionsWithoutAddress, ...listFilterOptions },
            ...pagingOptions,
            route: "transactions",
          }
        );
      });

      it("filters transactions visible by user when different address is provided", async () => {
        const { isAddressEqual } = jest.requireMock("../common/utils");
        isAddressEqual.mockReturnValue(false);

        await controller.getTransactions(filterTransactionsOptions, listFilterOptions, pagingOptions, user);
        expect(serviceMock.findAll).toHaveBeenCalledWith(
          {
            ...filterTransactionsOptions,
            timestamp: "timestamp",
            filterAddressInLogTopics: true,
            visibleBy: mockUser,
          },
          {
            filterOptions: { ...filterTransactionsOptions, ...listFilterOptions },
            ...pagingOptions,
            route: "transactions",
          }
        );
      });

      it("does not set visibleBy when provided address is same as user address", async () => {
        const { isAddressEqual } = jest.requireMock("../common/utils");
        isAddressEqual.mockReturnValue(true);

        await controller.getTransactions(filterTransactionsOptions, listFilterOptions, pagingOptions, user);
        expect(serviceMock.findAll).toHaveBeenCalledWith(
          {
            ...filterTransactionsOptions,
            timestamp: "timestamp",
            filterAddressInLogTopics: true,
          },
          {
            filterOptions: { ...filterTransactionsOptions, ...listFilterOptions },
            ...pagingOptions,
            route: "transactions",
          }
        );
      });
    });
  });

  describe("getTransaction", () => {
    describe("when transaction exists", () => {
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValue(transaction);
      });

      it("queries transactions by specified transaction hash", async () => {
        await controller.getTransaction(transactionHash, null);
        expect(serviceMock.findOne).toHaveBeenCalledTimes(1);
        expect(serviceMock.findOne).toHaveBeenCalledWith(transactionHash);
      });

      it("returns the transaction", async () => {
        const result = await controller.getTransaction(transactionHash, null);
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
          await controller.getTransaction(transactionHash, null);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });

    describe("when user is provided", () => {
      let user: MockProxy<UserParam>;
      const mockUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const transactionLogs = mock<Pagination<Log>>({
        items: [mock<Log>({ topics: [] })],
      });

      beforeEach(() => {
        user = mock<UserParam>({ address: mockUser });
        (serviceMock.findOne as jest.Mock).mockResolvedValue(transaction);
        (logServiceMock.findAll as jest.Mock).mockResolvedValue(transactionLogs);
      });

      afterEach(() => {
        clearAllMocks();
      });

      it("returns the transaction redacted for the user when user can see it", async () => {
        const redactedTransaction = { ...transaction, data: "0x" };
        (serviceMock.isTransactionVisibleByUser as jest.Mock).mockReturnValue(true);
        (serviceMock.redactForUser as jest.Mock).mockReturnValue(redactedTransaction);
        const result = await controller.getTransaction(transactionHash, user);
        expect(logServiceMock.findAll).toHaveBeenCalledWith(
          { transactionHash },
          {
            page: 1,
            limit: 10_000,
          }
        );
        expect(serviceMock.isTransactionVisibleByUser).toHaveBeenCalledWith(transaction, transactionLogs.items, user);
        expect(serviceMock.redactForUser).toHaveBeenCalledWith(transaction, user);
        expect(result).toBe(redactedTransaction);
      });

      it("throws NotFoundException when transaction is not visible to user", async () => {
        (serviceMock.isTransactionVisibleByUser as jest.Mock).mockReturnValue(false);

        try {
          await controller.getTransaction(transactionHash, user);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(serviceMock.isTransactionVisibleByUser).toHaveBeenCalledTimes(1);
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
        await controller.getTransactionTransfers(transactionHash, pagingOptions, null);
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
        const result = await controller.getTransactionTransfers(transactionHash, pagingOptions, null);
        expect(result).toBe(transactionTransfers);
      });

      describe("when user is provided", () => {
        let user: MockProxy<UserParam>;
        const transactionLogs = mock<Pagination<Log>>({
          items: [mock<Log>({ topics: [] })],
        });

        beforeEach(() => {
          user = mock<UserParam>({ address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" });
          (serviceMock.findOne as jest.Mock).mockResolvedValue(transaction);
          (logServiceMock.findAll as jest.Mock).mockResolvedValue(transactionLogs);
          (serviceMock.isTransactionVisibleByUser as jest.Mock).mockReturnValue(true);
        });

        it("includes visibleBy filter", async () => {
          await controller.getTransactionTransfers(transactionHash, pagingOptions, user);
          expect(transferServiceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ visibleBy: user.address }),
            expect.anything()
          );
        });

        it("throws NotFoundException when transaction is not visible to user", async () => {
          (serviceMock.isTransactionVisibleByUser as jest.Mock).mockReturnValue(false);
          await expect(controller.getTransactionTransfers(transactionHash, pagingOptions, user)).rejects.toThrow(
            NotFoundException
          );
          expect(logServiceMock.findAll).toHaveBeenCalledWith({ transactionHash }, { page: 1, limit: 10_000 });
          expect(serviceMock.isTransactionVisibleByUser).toHaveBeenCalledWith(transaction, transactionLogs.items, user);
          expect(transferServiceMock.findAll).not.toHaveBeenCalled();
        });
      });
    });

    describe("when transaction does not exist", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(false);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getTransactionTransfers(transactionHash, pagingOptions, null);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });

      it("throws NotFoundException when user is provided", async () => {
        (serviceMock.findOne as jest.Mock).mockResolvedValue(null);
        await expect(
          controller.getTransactionTransfers(
            transactionHash,
            pagingOptions,
            mock<UserParam>({ address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" })
          )
        ).rejects.toThrow(NotFoundException);
        expect(serviceMock.isTransactionVisibleByUser).not.toHaveBeenCalled();
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
        await controller.getTransactionLogs(transactionHash, pagingOptions, null);
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
        const result = await controller.getTransactionLogs(transactionHash, pagingOptions, null);
        expect(result).toBe(transactionLogs);
      });

      describe("when user is provided", () => {
        let user: MockProxy<UserParam>;
        beforeEach(() => {
          user = mock<UserParam>({ address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" });
          (serviceMock.findOne as jest.Mock).mockResolvedValue(transaction);
          (serviceMock.isTransactionVisibleByUser as jest.Mock).mockReturnValue(true);
        });

        it("includes visibleBy filter", async () => {
          await controller.getTransactionLogs(transactionHash, pagingOptions, user);
          expect(logServiceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ visibleBy: user.address }),
            expect.anything()
          );
        });

        it("throws NotFoundException when transaction is not visible to user", async () => {
          (serviceMock.isTransactionVisibleByUser as jest.Mock).mockReturnValue(false);
          await expect(controller.getTransactionLogs(transactionHash, pagingOptions, user)).rejects.toThrow(
            NotFoundException
          );
          expect(logServiceMock.findAll).toHaveBeenCalledTimes(1);
          expect(logServiceMock.findAll).toHaveBeenCalledWith({ transactionHash }, { page: 1, limit: 10_000 });
          expect(serviceMock.isTransactionVisibleByUser).toHaveBeenCalledWith(transaction, transactionLogs.items, user);
        });
      });
    });

    describe("when transaction does not exist", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(false);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getTransactionLogs(transactionHash, pagingOptions, null);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });
});
