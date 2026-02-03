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
import { UserWithRoles } from "../api/pipes/addUserRoles.pipe";
import { ConfigService } from "@nestjs/config";
const clearAllMocks = jest.clearAllMocks;

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

    const configServiceValues = {
      "prividium.permissionsApiUrl": "https://permissions-api.example.com",
    };

    const configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => configServiceValues[key]),
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
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
      let user: MockProxy<UserWithRoles>;
      const mockUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      beforeEach(() => {
        user = mock<UserWithRoles>({ address: mockUser, roles: [], isAdmin: false, token: "token1" });
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
      let user: MockProxy<UserWithRoles>;
      const mockUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const transactionLogs = mock<Pagination<Log>>({
        items: [mock<Log>({ topics: [] })],
      });

      beforeEach(() => {
        user = mock<UserWithRoles>({ address: mockUser, isAdmin: false });
        (serviceMock.findOne as jest.Mock).mockResolvedValue(transaction);
        (logServiceMock.findAll as jest.Mock).mockResolvedValue(transactionLogs);
      });

      afterEach(() => {
        clearAllMocks();
      });

      it("returns the transaction when user can see it", async () => {
        (serviceMock.isTransactionVisibleByUser as jest.Mock).mockReturnValue(true);
        const result = await controller.getTransaction(transactionHash, user);
        expect(logServiceMock.findAll).toHaveBeenCalledWith(
          { transactionHash },
          {
            page: 1,
            limit: 10_000,
          }
        );
        expect(serviceMock.isTransactionVisibleByUser).toHaveBeenCalledWith(transaction, transactionLogs.items, user);
        expect(result).toBe(transaction);
      });

      it("returns the transaction when user is admin", async () => {
        (serviceMock.isTransactionVisibleByUser as jest.Mock).mockReturnValue(false);

        const result = await controller.getTransaction(
          transactionHash,
          mock<UserWithRoles>({
            address: mockUser,
            isAdmin: true,
          })
        );
        expect(logServiceMock.findAll).not.toHaveBeenCalled();
        expect(serviceMock.isTransactionVisibleByUser).not.toHaveBeenCalled();
        expect(result).toBe(transaction);
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
        let user: MockProxy<UserWithRoles>;
        beforeEach(() => {
          user = mock<UserWithRoles>({
            address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            isAdmin: false,
            roles: [],
            token: "token1",
          });
        });

        it("includes visibleBy filter", async () => {
          await controller.getTransactionTransfers(transactionHash, pagingOptions, user);
          expect(transferServiceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ visibleBy: user.address }),
            expect.anything()
          );
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
    });
  });

  describe("getTransactionLogs", () => {
    const mockLogs = [
      mock<Log>({ address: "0xaddr1", topics: ["0xtopic0a", "0xtopic1a", "0xtopic2a", "0xtopic3a"] }),
      mock<Log>({ address: "0xaddr2", topics: ["0xtopic0b", "0xtopic1b"] }),
      mock<Log>({ address: "0xaddr3", topics: ["0xtopic0c"] }),
    ];
    const transactionLogs = mock<Pagination<Log>>({ items: mockLogs });

    describe("when transaction exists", () => {
      beforeEach(() => {
        (serviceMock.exists as jest.Mock).mockResolvedValueOnce(true);
        (logServiceMock.findAll as jest.Mock).mockResolvedValueOnce(transactionLogs);
      });

      it("queries logs with the specified options when no user", async () => {
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

      it("returns transaction logs when no user", async () => {
        const result = await controller.getTransactionLogs(transactionHash, pagingOptions, null);
        expect(result).toBe(transactionLogs);
      });

      describe("when user is admin", () => {
        it("returns logs without permission check", async () => {
          const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response());
          const adminUser = mock<UserWithRoles>({
            address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            isAdmin: true,
            roles: [],
            token: "admin-token",
          });
          const result = await controller.getTransactionLogs(transactionHash, pagingOptions, adminUser);
          expect(result).toBe(transactionLogs);
          expect(logServiceMock.findAll).toHaveBeenCalledWith(
            { transactionHash },
            {
              ...pagingOptions,
              route: `transactions/${transactionHash}/logs`,
            }
          );
          expect(fetchSpy).not.toHaveBeenCalled();
          fetchSpy.mockRestore();
        });
      });

      describe("when user is non-admin", () => {
        let user: MockProxy<UserWithRoles>;
        beforeEach(() => {
          user = mock<UserWithRoles>({
            address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            isAdmin: false,
            roles: [],
            token: "user-token",
          });
        });

        it("filters logs by batch-event-permission response", async () => {
          (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ authorized: [true, false, true] }),
          });

          const result = await controller.getTransactionLogs(
            transactionHash,
            { limit: 10, page: 1, maxLimit: 10000 },
            user
          );

          expect(global.fetch).toHaveBeenCalledWith(
            new URL("/api/check/batch-event-permission", "https://permissions-api.example.com"),
            expect.objectContaining({
              method: "POST",
              headers: {
                Authorization: "Bearer user-token",
                "Content-Type": "application/json",
              },
              body: JSON.stringify([
                {
                  contractAddress: "0xaddr1",
                  topic0: "0xtopic0a",
                  topic1: "0xtopic1a",
                  topic2: "0xtopic2a",
                  topic3: "0xtopic3a",
                },
                {
                  contractAddress: "0xaddr2",
                  topic0: "0xtopic0b",
                  topic1: "0xtopic1b",
                  topic2: undefined,
                  topic3: undefined,
                },
                {
                  contractAddress: "0xaddr3",
                  topic0: "0xtopic0c",
                  topic1: undefined,
                  topic2: undefined,
                  topic3: undefined,
                },
              ]),
            })
          );

          expect(result.items).toHaveLength(2);
          expect(result.items[0]).toBe(mockLogs[0]);
          expect(result.items[1]).toBe(mockLogs[2]);
          expect(result.meta.totalItems).toBe(2);
        });

        it("paginates filtered logs correctly", async () => {
          (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ authorized: [true, true, true] }),
          });

          const result = await controller.getTransactionLogs(
            transactionHash,
            { limit: 2, page: 1, maxLimit: 10000 },
            user
          );

          expect(result.items).toHaveLength(2);
          expect(result.meta.totalItems).toBe(3);
          expect(result.meta.totalPages).toBe(2);
          expect(result.meta.currentPage).toBe(1);
          expect(result.meta.itemsPerPage).toBe(2);
        });

        it("throws error when permission API fails with non-ok response", async () => {
          (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
            ok: false,
            status: 500,
          });

          await expect(
            controller.getTransactionLogs(transactionHash, { limit: 10, page: 1, maxLimit: 10000 }, user)
          ).rejects.toThrow("Permission check failed");
        });

        it("throws error when permission API network request fails", async () => {
          (global.fetch as jest.Mock) = jest.fn().mockRejectedValueOnce(new Error("Network error"));

          await expect(
            controller.getTransactionLogs(transactionHash, { limit: 10, page: 1, maxLimit: 10000 }, user)
          ).rejects.toThrow("Permission check failed");
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
