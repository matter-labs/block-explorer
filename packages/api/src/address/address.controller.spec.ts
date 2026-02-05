import { Test, TestingModule } from "@nestjs/testing";
import { mock, MockProxy } from "jest-mock-extended";
import { Pagination } from "nestjs-typeorm-paginate";
import { AddressController } from "./address.controller";
import { AddressService } from "./address.service";
import { BalanceService } from "../balance/balance.service";
import { BlockService } from "../block/block.service";
import { LogService } from "../log/log.service";
import { TransactionService } from "../transaction/transaction.service";
import { Log } from "../log/log.entity";
import { Token } from "../token/token.entity";
import { PagingOptionsWithMaxItemsLimitDto } from "../common/dtos";
import { AddressType } from "./dtos";
import { TransferService } from "../transfer/transfer.service";
import { Transfer, TransferType } from "../transfer/transfer.entity";
import { Address } from "./address.entity";
import { ForbiddenException } from "@nestjs/common";
import { Wallet, zeroPadValue } from "ethers";
import { UserWithRoles } from "../api/pipes/addUserRoles.pipe";
import { ConfigService } from "@nestjs/config";

jest.mock("../common/utils", () => ({
  ...jest.requireActual("../common/utils"),
  buildDateFilter: jest.fn().mockReturnValue({ timestamp: "timestamp" }),
}));

describe("AddressController", () => {
  let controller: AddressController;
  let serviceMock: MockProxy<AddressService>;
  let blockServiceMock: BlockService;
  let logServiceMock: MockProxy<LogService>;
  let balanceServiceMock: BalanceService;
  let transactionServiceMock: TransactionService;
  let transferServiceMock: TransferService;
  const blockchainAddress = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
  const normalizedAddress = "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF";
  const pagingOptions: PagingOptionsWithMaxItemsLimitDto = { limit: 10, page: 2, maxLimit: 10000 };

  beforeEach(async () => {
    serviceMock = mock<AddressService>();
    blockServiceMock = mock<BlockService>();
    transactionServiceMock = mock<TransactionService>();
    logServiceMock = mock<LogService>();
    balanceServiceMock = mock<BalanceService>();
    transferServiceMock = mock<TransferService>();

    const configServiceValues = {
      "prividium.permissionsApiUrl": "https://permissions-api.example.com",
    };

    const configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => configServiceValues[key]),
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressController],
      providers: [
        {
          provide: AddressService,
          useValue: serviceMock,
        },
        {
          provide: BlockService,
          useValue: blockServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: TransactionService,
          useValue: transactionServiceMock,
        },
        {
          provide: LogService,
          useValue: logServiceMock,
        },
        {
          provide: BalanceService,
          useValue: balanceServiceMock,
        },
        {
          provide: TransferService,
          useValue: transferServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AddressController>(AddressController);
  });

  describe("getAddress", () => {
    let addressRecord: Address;

    beforeEach(() => {
      (balanceServiceMock.getBalances as jest.Mock).mockResolvedValue({
        blockNumber: 0,
        balances: {},
      });
    });

    it("queries addresses by specified address", async () => {
      await controller.getAddress(blockchainAddress, null);
      expect(serviceMock.findOne).toHaveBeenCalledTimes(1);
      expect(serviceMock.findOne).toHaveBeenCalledWith(blockchainAddress);
    });

    it("queries address balances", async () => {
      await controller.getAddress(blockchainAddress, null);
      expect(balanceServiceMock.getBalances).toHaveBeenCalledTimes(1);
      expect(balanceServiceMock.getBalances).toHaveBeenCalledWith(blockchainAddress);
    });

    describe("when contract address exists", () => {
      const transactionHash = "transactionHash";
      const creatorAddress = "creatorAddress";
      const totalTxCount = 20;
      const addressBalances = {
        balances: {
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF": {
            balance: "10",
            token: mock<Token>({ l2Address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" }),
          },
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA": {
            balance: "20",
            token: mock<Token>({ l2Address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA" }),
          },
        },
        blockNumber: 30,
      };

      beforeEach(() => {
        addressRecord = {
          address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          bytecode: "0x123",
          createdInBlockNumber: 30,
          creatorTxHash: transactionHash,
          creatorAddress,
          isEvmLike: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        serviceMock.findOne.mockResolvedValue(addressRecord);
        (transactionServiceMock.count as jest.Mock).mockResolvedValue(totalTxCount);
        (balanceServiceMock.getBalances as jest.Mock).mockResolvedValue(addressBalances);
      });

      it("queries totalTransactions value from transaction receipt repo with formatted contractAddress", async () => {
        await controller.getAddress(blockchainAddress, null);
        expect(transactionServiceMock.count).toHaveBeenCalledTimes(1);
        expect(transactionServiceMock.count).toHaveBeenCalledWith({
          "from|to": "0xffffffffffffffffffffffffffffffffffffffff",
        });
      });

      it("returns the contract address record", async () => {
        const result = await controller.getAddress(blockchainAddress, null);
        expect(result).toStrictEqual({
          type: AddressType.Contract,
          ...addressRecord,
          blockNumber: addressBalances.blockNumber,
          balances: addressBalances.balances,
          totalTransactions: totalTxCount,
          isEvmLike: addressRecord.isEvmLike,
        });
      });

      describe("when there are no balances for the contract", () => {
        const defaultBalancesResponse = {
          balances: {},
          blockNumber: 0,
        };

        beforeEach(() => {
          (balanceServiceMock.getBalances as jest.Mock).mockResolvedValue(defaultBalancesResponse);
        });

        it("returns the contract address record with empty balances and block number from the address record", async () => {
          const result = await controller.getAddress(blockchainAddress, null);
          expect(result).toStrictEqual({
            type: AddressType.Contract,
            ...addressRecord,
            blockNumber: addressRecord.createdInBlockNumber,
            balances: defaultBalancesResponse.balances,
            totalTransactions: totalTxCount,
            isEvmLike: addressRecord.isEvmLike,
          });
        });
      });
    });

    describe("when address balances exist", () => {
      const sealedNonce = 10;
      const verifiedNonce = 10;
      const addressBalances = {
        balances: {
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF": {
            balance: "10",
            token: mock<Token>({ l2Address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" }),
          },
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA": {
            balance: "20",
            token: mock<Token>({ l2Address: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA" }),
          },
        },
        blockNumber: 30,
      };
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValue(null);
        (transactionServiceMock.getAccountNonce as jest.Mock)
          .mockResolvedValueOnce(sealedNonce)
          .mockResolvedValueOnce(verifiedNonce);
        (balanceServiceMock.getBalances as jest.Mock).mockResolvedValue(addressBalances);
      });

      it("queries account sealed and verified nonce", async () => {
        await controller.getAddress(blockchainAddress, null);
        expect(transactionServiceMock.getAccountNonce).toHaveBeenCalledTimes(2);
        expect(transactionServiceMock.getAccountNonce).toHaveBeenCalledWith({ accountAddress: blockchainAddress });
        expect(transactionServiceMock.getAccountNonce).toHaveBeenCalledWith({
          accountAddress: blockchainAddress,
          isVerified: true,
        });
      });

      it("queries account balances", async () => {
        await controller.getAddress(blockchainAddress, null);
        expect(balanceServiceMock.getBalances).toHaveBeenCalledTimes(1);
        expect(balanceServiceMock.getBalances).toHaveBeenCalledWith(blockchainAddress);
      });

      it("returns the account address record", async () => {
        const result = await controller.getAddress(blockchainAddress, null);
        expect(result).toStrictEqual({
          type: AddressType.Account,
          address: normalizedAddress,
          blockNumber: addressBalances.blockNumber,
          balances: addressBalances.balances,
          sealedNonce,
          verifiedNonce,
        });
      });
    });

    describe("when balances do not exist", () => {
      const blockNumber = 10;
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValueOnce(null);
        (blockServiceMock.getLastBlockNumber as jest.Mock).mockResolvedValueOnce(blockNumber);
        (balanceServiceMock.getBalances as jest.Mock).mockResolvedValue({
          blockNumber: 0,
          balances: {},
        });
      });

      it("returns the default account address response", async () => {
        const result = await controller.getAddress(blockchainAddress, null);
        expect(result).toStrictEqual({
          type: AddressType.Account,
          address: normalizedAddress,
          blockNumber,
          balances: {},
          sealedNonce: 0,
          verifiedNonce: 0,
        });
      });
    });

    describe("when user is provided", () => {
      let user: MockProxy<UserWithRoles>;
      const mockUser = "0xc0ffee254729296a45a3885639AC7E10F9d54979";
      beforeEach(() => {
        user = mock<UserWithRoles>({ address: mockUser, isAdmin: false, roles: [] });
      });

      it("throws if address is an account and is not own address", async () => {
        serviceMock.findOne.mockResolvedValue(mock<Address>({ address: mockUser, bytecode: "0x" }));
        await expect(controller.getAddress(blockchainAddress, user)).rejects.toThrow(ForbiddenException);
      });

      describe("when address is a contract", () => {
        beforeEach(() => {
          serviceMock.findOne.mockResolvedValue(mock<Address>({ address: blockchainAddress, bytecode: "0x123" }));
          (transactionServiceMock.count as jest.Mock).mockResolvedValue(0);
          (balanceServiceMock.getBalances as jest.Mock).mockResolvedValue({
            blockNumber: 30,
            balances: {},
          });
        });

        it("does not include additional information if user is not owner (no logs found)", async () => {
          logServiceMock.findManyByTopics.mockResolvedValueOnce([]);

          const result = await controller.getAddress(blockchainAddress, user);

          expect(logServiceMock.findManyByTopics).toHaveBeenCalledWith({
            address: blockchainAddress,
            topics: {
              topic0: "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0",
            },
            page: 1,
            offset: 1,
          });
          expect(result.balances).toEqual({});
          expect(result["bytecode"]).toEqual("");
          expect(result["creatorAddress"]).toEqual("");
          expect(result["creatorTxHash"]).toEqual("");
        });

        it("does not include additional information if user is not owner (ownerTopic is undefined)", async () => {
          logServiceMock.findManyByTopics.mockResolvedValueOnce([
            {
              topics: ["0x", "0x"], // topics[2] is undefined
              address: blockchainAddress,
              blockNumber: 10,
              logIndex: 0,
              transactionHash: "0x",
              transactionIndex: 0,
              timestamp: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              number: 0,
              data: "0x",
              toJSON: jest.fn(),
            },
          ]);

          const result = await controller.getAddress(blockchainAddress, user);

          expect(result.balances).toEqual({});
          expect(result["bytecode"]).toEqual("");
          expect(result["creatorAddress"]).toEqual("");
          expect(result["creatorTxHash"]).toEqual("");
        });

        it("does not include additional information if user is not owner (different owner)", async () => {
          logServiceMock.findManyByTopics.mockResolvedValueOnce([
            {
              topics: ["0x", "0x", zeroPadValue(Wallet.createRandom().address, 32)],
              address: blockchainAddress,
              blockNumber: 10,
              logIndex: 0,
              transactionHash: "0x",
              transactionIndex: 0,
              timestamp: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              number: 0,
              data: "0x",
              toJSON: jest.fn(),
            },
          ]);

          const result = await controller.getAddress(blockchainAddress, user);

          expect(result.balances).toEqual({});
          expect(result["bytecode"]).toEqual("");
          expect(result["creatorAddress"]).toEqual("");
          expect(result["creatorTxHash"]).toEqual("");
        });

        it("includes additional information if user is owner", async () => {
          logServiceMock.findManyByTopics.mockResolvedValueOnce([
            {
              topics: ["0x", "0x", zeroPadValue(mockUser, 32)],
              address: blockchainAddress,
              blockNumber: 10,
              logIndex: 0,
              transactionHash: "0x",
              transactionIndex: 0,
              timestamp: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              number: 0,
              data: "0x",
              toJSON: jest.fn(),
            },
          ]);

          const result = await controller.getAddress(blockchainAddress, user);

          expect(balanceServiceMock.getBalances).toHaveBeenCalledWith(blockchainAddress);
          expect(result.balances).toBeDefined();
          expect(result["bytecode"]).not.toEqual("");
          expect(result["creatorAddress"]).not.toEqual("");
          expect(result["creatorTxHash"]).not.toEqual("");
        });

        it("does not include additional information if logService throws an error", async () => {
          const err = new Error("Database error");
          logServiceMock.findManyByTopics.mockRejectedValueOnce(err);
          const loggerSpy = jest.spyOn(controller["logger"], "error").mockImplementation();

          const result = await controller.getAddress(blockchainAddress, user);

          expect(loggerSpy).toHaveBeenCalledWith("Failed to check if user is owner of contract", err.stack);
          expect(result.balances).toEqual({});
          expect(result["bytecode"]).toEqual("");
          expect(result["creatorAddress"]).toEqual("");
          expect(result["creatorTxHash"]).toEqual("");

          loggerSpy.mockRestore();
        });
      });

      it("includes balances if address is an account and is self", async () => {
        serviceMock.findOne.mockResolvedValue(mock<Address>({ address: mockUser, bytecode: "0x" }));
        await controller.getAddress(mockUser, user);
        expect(balanceServiceMock.getBalances).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("getAddressLogs", () => {
    const transactionLogs = mock<Pagination<Log>>();
    const address = "address";
    describe("when address exists", () => {
      beforeEach(() => {
        (logServiceMock.findAll as jest.Mock).mockResolvedValueOnce(transactionLogs);
      });

      it("queries addresses with the specified options", async () => {
        await controller.getAddressLogs(address, pagingOptions, null);
        expect(logServiceMock.findAll).toHaveBeenCalledTimes(1);
        expect(logServiceMock.findAll).toHaveBeenCalledWith(
          { address },
          {
            ...pagingOptions,
            route: `address/${address}/logs`,
          }
        );
      });

      it("returns address logs", async () => {
        const result = await controller.getAddressLogs(address, pagingOptions, null);
        expect(result).toBe(transactionLogs);
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

        it("throws ForbiddenException for non-admin user", async () => {
          await expect(controller.getAddressLogs(address, pagingOptions, user)).rejects.toThrow(ForbiddenException);
        });

        it("returns logs for admin user", async () => {
          user.isAdmin = true;
          const result = await controller.getAddressLogs(address, pagingOptions, user);
          expect(result).toBe(transactionLogs);
          expect(logServiceMock.findAll).toHaveBeenCalledWith(
            { address },
            {
              ...pagingOptions,
              route: `address/${address}/logs`,
            }
          );
        });
      });
    });
  });

  describe("getAddressTransfers", () => {
    const transfers = mock<Pagination<Transfer>>();
    const address = "address";
    const listFilterOptions = {
      fromDate: "2023-02-08T15:34:46.251Z",
      toDate: "2023-02-08T17:34:46.251Z",
    };
    const pagingOptions: PagingOptionsWithMaxItemsLimitDto = { limit: 10, page: 2, maxLimit: 10000 };

    beforeEach(() => {
      (transferServiceMock.findAll as jest.Mock).mockResolvedValueOnce(transfers);
    });

    it("queries transfers with the specified options when no filters provided", async () => {
      await controller.getAddressTransfers(address, {}, listFilterOptions, pagingOptions, null);
      expect(transferServiceMock.findAll).toHaveBeenCalledTimes(1);
      expect(transferServiceMock.findAll).toHaveBeenCalledWith(
        {
          address,
          isFeeOrRefund: false,
          timestamp: "timestamp",
        },
        {
          filterOptions: listFilterOptions,
          ...pagingOptions,
          route: `address/${address}/transfers`,
        }
      );
    });

    it("queries transfers with the specified options when filters are provided", async () => {
      await controller.getAddressTransfers(
        address,
        { type: TransferType.Transfer },
        listFilterOptions,
        pagingOptions,
        null
      );
      expect(transferServiceMock.findAll).toHaveBeenCalledTimes(1);
      expect(transferServiceMock.findAll).toHaveBeenCalledWith(
        {
          address,
          type: TransferType.Transfer,
          timestamp: "timestamp",
        },
        {
          filterOptions: { type: TransferType.Transfer, ...listFilterOptions },
          ...pagingOptions,
          route: `address/${address}/transfers`,
        }
      );
    });

    it("returns the transfers", async () => {
      const result = await controller.getAddressTransfers(address, {}, listFilterOptions, pagingOptions, null);
      expect(result).toBe(transfers);
    });

    describe("when user is provided", () => {
      let user: MockProxy<UserWithRoles>;
      beforeEach(() => {
        user = mock<UserWithRoles>({
          address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          isAdmin: false,
          roles: [],
          token: "token",
        });
      });

      it("includes visibleBy filter", async () => {
        await controller.getAddressTransfers(address, {}, listFilterOptions, pagingOptions, user);
        expect(transferServiceMock.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ visibleBy: user.address }),
          expect.anything()
        );
      });
    });
  });
});
