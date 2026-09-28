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
import { UserWithPermissions } from "../api/pipes/addUserRoles.pipe";
import { ConfigService } from "@nestjs/config";
import clearAllMocks = jest.clearAllMocks;

jest.mock("../common/utils", () => ({
  buildBlockFilter: jest.fn().mockReturnValue({ blockNumber: "blockNumber" }),
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
      fromBlock: 10,
      toBlock: 100,
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

    it("does not redact the transactions", async () => {
      await controller.getTransactions(filterTransactionsOptions, listFilterOptions, pagingOptions, null);
      expect(serviceMock.redactForUser).not.toHaveBeenCalled();
    });

    describe("when user is provided", () => {
      let user: MockProxy<UserWithPermissions>;
      const mockUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const firstTransaction = { hash: "0x01" } as Transaction;
      const secondTransaction = { hash: "0x02" } as Transaction;
      const userTransactions = new Pagination(
        [firstTransaction, secondTransaction],
        { itemCount: 2, itemsPerPage: 10, currentPage: 2 },
        { first: "first", previous: "previous", next: "next", last: "last" }
      );
      beforeEach(() => {
        user = mock<UserWithPermissions>({ address: mockUser, hasFullReadAccess: false, token: "token1" });
        (serviceMock.findAll as jest.Mock).mockReset();
        (serviceMock.findAll as jest.Mock).mockResolvedValue(userTransactions);
        (serviceMock.redactForUser as jest.Mock).mockImplementation((transaction) => ({
          ...transaction,
          data: "0x",
        }));
      });

      it("returns the transactions redacted for the user", async () => {
        const result = await controller.getTransactions(
          filterTransactionsOptions,
          listFilterOptions,
          pagingOptions,
          user
        );
        expect(serviceMock.redactForUser).toHaveBeenCalledTimes(2);
        expect(serviceMock.redactForUser).toHaveBeenCalledWith(firstTransaction, user);
        expect(serviceMock.redactForUser).toHaveBeenCalledWith(secondTransaction, user);
        expect(result).toEqual({
          items: [
            { hash: "0x01", data: "0x" },
            { hash: "0x02", data: "0x" },
          ],
          meta: userTransactions.meta,
          links: userTransactions.links,
        });
      });

      it("returns the transactions as is when user has full read access", async () => {
        const result = await controller.getTransactions(
          filterTransactionsOptions,
          listFilterOptions,
          pagingOptions,
          mock<UserWithPermissions>({ address: mockUser, hasFullReadAccess: true })
        );
        expect(serviceMock.redactForUser).not.toHaveBeenCalled();
        expect(result).toBe(userTransactions);
      });

      it("passes visibleBy when no address is provided", async () => {
        const filterOptionsWithoutAddress = { blockNumber: 10 };
        await controller.getTransactions(filterOptionsWithoutAddress, listFilterOptions, pagingOptions, user);
        expect(serviceMock.findAll).toHaveBeenCalledWith(
          {
            ...filterOptionsWithoutAddress,
            visibleBy: mockUser,
          },
          {
            filterOptions: { ...filterOptionsWithoutAddress, ...listFilterOptions },
            ...pagingOptions,
            route: "transactions",
          }
        );
      });

      it("passes visibleBy when a different address is provided", async () => {
        await controller.getTransactions(filterTransactionsOptions, listFilterOptions, pagingOptions, user);
        expect(serviceMock.findAll).toHaveBeenCalledWith(
          {
            ...filterTransactionsOptions,
            visibleBy: mockUser,
          },
          {
            filterOptions: { ...filterTransactionsOptions, ...listFilterOptions },
            ...pagingOptions,
            route: "transactions",
          }
        );
      });

      it("passes visibleBy even when the provided address equals user address", async () => {
        const filterOptionsWithOwnAddress = { blockNumber: 10, address: mockUser };
        await controller.getTransactions(filterOptionsWithOwnAddress, listFilterOptions, pagingOptions, user);
        expect(serviceMock.findAll).toHaveBeenCalledWith(
          {
            ...filterOptionsWithOwnAddress,
            visibleBy: mockUser,
          },
          {
            filterOptions: { ...filterOptionsWithOwnAddress, ...listFilterOptions },
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
        expect(serviceMock.redactForUser).not.toHaveBeenCalled();
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
      let user: MockProxy<UserWithPermissions>;
      const mockUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

      beforeEach(() => {
        user = mock<UserWithPermissions>({ address: mockUser, hasFullReadAccess: false });
        (serviceMock.findOne as jest.Mock).mockResolvedValue(transaction);
      });

      afterEach(() => {
        clearAllMocks();
      });

      it("returns the transaction redacted for the user when user can see it", async () => {
        const redactedTransaction = { ...transaction, data: "0x" };
        (serviceMock.isTransactionVisibleByUser as jest.Mock).mockResolvedValue(true);
        (serviceMock.redactForUser as jest.Mock).mockReturnValue(redactedTransaction);
        const result = await controller.getTransaction(transactionHash, user);
        expect(serviceMock.isTransactionVisibleByUser).toHaveBeenCalledWith(transaction, user);
        expect(serviceMock.redactForUser).toHaveBeenCalledWith(transaction, user);
        expect(result).toBe(redactedTransaction);
      });

      it("returns the transaction when user is admin", async () => {
        const result = await controller.getTransaction(
          transactionHash,
          mock<UserWithPermissions>({
            address: mockUser,
            hasFullReadAccess: true,
          })
        );
        expect(serviceMock.isTransactionVisibleByUser).not.toHaveBeenCalled();
        expect(serviceMock.redactForUser).not.toHaveBeenCalled();
        expect(result).toBe(transaction);
      });

      it("throws NotFoundException when transaction is not visible to user", async () => {
        (serviceMock.isTransactionVisibleByUser as jest.Mock).mockResolvedValue(false);

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
        let user: MockProxy<UserWithPermissions>;
        beforeEach(() => {
          user = mock<UserWithPermissions>({
            address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            hasFullReadAccess: false,
            token: "token1",
          });
          (serviceMock.findOne as jest.Mock).mockResolvedValue(transaction);
          (serviceMock.isTransactionVisibleByUser as jest.Mock).mockResolvedValue(true);
        });

        it("includes visibleBy filter", async () => {
          await controller.getTransactionTransfers(transactionHash, pagingOptions, user);
          expect(transferServiceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ visibleBy: user.address }),
            expect.anything()
          );
        });

        it("checks that the transaction is visible by the user", async () => {
          await controller.getTransactionTransfers(transactionHash, pagingOptions, user);
          expect(serviceMock.findOne).toHaveBeenCalledWith(transactionHash);
          expect(serviceMock.isTransactionVisibleByUser).toHaveBeenCalledWith(transaction, user);
        });

        it("throws NotFoundException when transaction is not visible to user", async () => {
          (serviceMock.isTransactionVisibleByUser as jest.Mock).mockResolvedValue(false);
          await expect(controller.getTransactionTransfers(transactionHash, pagingOptions, user)).rejects.toThrow(
            NotFoundException
          );
          expect(transferServiceMock.findAll).not.toHaveBeenCalled();
        });

        it("does not check transaction visibility when user has full read access", async () => {
          const result = await controller.getTransactionTransfers(
            transactionHash,
            pagingOptions,
            mock<UserWithPermissions>({ address: user.address, hasFullReadAccess: true })
          );
          expect(serviceMock.isTransactionVisibleByUser).not.toHaveBeenCalled();
          expect(transferServiceMock.findAll).toHaveBeenCalledWith({ transactionHash }, expect.anything());
          expect(result).toBe(transactionTransfers);
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
            mock<UserWithPermissions>({
              address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
              hasFullReadAccess: false,
            })
          )
        ).rejects.toThrow(NotFoundException);
        expect(serviceMock.isTransactionVisibleByUser).not.toHaveBeenCalled();
        expect(transferServiceMock.findAll).not.toHaveBeenCalled();
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
        let user: MockProxy<UserWithPermissions>;
        beforeEach(() => {
          user = mock<UserWithPermissions>({
            address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            hasFullReadAccess: false,
            token: "token1",
          });
          (serviceMock.findOne as jest.Mock).mockResolvedValue(transaction);
          (serviceMock.isTransactionVisibleByUser as jest.Mock).mockResolvedValue(true);
        });

        it("includes visibleBy filter", async () => {
          await controller.getTransactionLogs(transactionHash, pagingOptions, user);
          expect(logServiceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ visibleBy: user.address }),
            expect.anything()
          );
        });

        it("checks that the transaction is visible by the user", async () => {
          await controller.getTransactionLogs(transactionHash, pagingOptions, user);
          expect(serviceMock.findOne).toHaveBeenCalledWith(transactionHash);
          expect(serviceMock.isTransactionVisibleByUser).toHaveBeenCalledWith(transaction, user);
        });

        it("throws NotFoundException when transaction is not visible to user", async () => {
          (serviceMock.isTransactionVisibleByUser as jest.Mock).mockResolvedValue(false);
          await expect(controller.getTransactionLogs(transactionHash, pagingOptions, user)).rejects.toThrow(
            NotFoundException
          );
          expect(logServiceMock.findAll).not.toHaveBeenCalled();
        });

        it("does not check transaction visibility when user has full read access", async () => {
          const result = await controller.getTransactionLogs(
            transactionHash,
            pagingOptions,
            mock<UserWithPermissions>({ address: user.address, hasFullReadAccess: true })
          );
          expect(serviceMock.isTransactionVisibleByUser).not.toHaveBeenCalled();
          expect(logServiceMock.findAll).toHaveBeenCalledWith({ transactionHash }, expect.anything());
          expect(result).toBe(transactionLogs);
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

      it("throws NotFoundException when user is provided", async () => {
        (serviceMock.findOne as jest.Mock).mockResolvedValue(null);
        await expect(
          controller.getTransactionLogs(
            transactionHash,
            pagingOptions,
            mock<UserWithPermissions>({
              address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
              hasFullReadAccess: false,
            })
          )
        ).rejects.toThrow(NotFoundException);
        expect(serviceMock.isTransactionVisibleByUser).not.toHaveBeenCalled();
        expect(logServiceMock.findAll).not.toHaveBeenCalled();
      });
    });
  });
});
