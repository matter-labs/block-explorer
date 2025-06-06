import { Test, TestingModule } from "@nestjs/testing";
import { mock, MockProxy } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { AddressService } from "./address.service";
import { Address } from "./address.entity";
import { BalanceService } from "../balance/balance.service";
import { TransactionService } from "../transaction/transaction.service";
import { BlockService } from "../block/block.service";
import { Token } from "../token/token.entity";
import { AddressType } from "./dtos";
import { getAddress } from "ethers";

describe("AddressService", () => {
  let addressRecord;
  let service: AddressService;
  let repositoryMock: MockProxy<Repository<Address>>;
  const blockchainAddress = "0x" + "a".repeat(40);

  let transactionService: MockProxy<TransactionService>;
  let balanceService: MockProxy<BalanceService>;
  let blockService: MockProxy<BlockService>;

  beforeEach(async () => {
    repositoryMock = mock<Repository<Address>>();
    transactionService = mock<TransactionService>();
    balanceService = mock<BalanceService>();
    blockService = mock<BlockService>();

    addressRecord = {
      address: blockchainAddress,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        {
          provide: getRepositoryToken(Address),
          useValue: repositoryMock,
        },
        {
          provide: TransactionService,
          useValue: transactionService,
        },
        {
          provide: BalanceService,
          useValue: balanceService,
        },
        {
          provide: BlockService,
          useValue: blockService,
        },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("findOne", () => {
    beforeEach(() => {
      (repositoryMock.findOneBy as jest.Mock).mockResolvedValue(addressRecord);
    });

    it("queries addresses by specified address", async () => {
      await service.findOne(blockchainAddress);
      expect(repositoryMock.findOneBy).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ address: blockchainAddress });
    });

    it("returns addressRecord by address", async () => {
      const result = await service.findOne(blockchainAddress);
      expect(result).toBe(addressRecord);
    });
  });

  describe("findByAddresses", () => {
    beforeEach(() => {
      (repositoryMock.find as jest.Mock).mockResolvedValue([addressRecord]);
    });

    it("queries addresses by specified addresses list", async () => {
      await service.findByAddresses([blockchainAddress]);
      expect(repositoryMock.find).toHaveBeenCalledTimes(1);
      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: {
          address: In([blockchainAddress]),
        },
      });
    });

    it("returns address records", async () => {
      const result = await service.findByAddresses([blockchainAddress]);
      expect(result).toEqual([addressRecord]);
    });
  });

  describe("#findFullAddress", () => {
    beforeEach(() => {
      balanceService.getBalances.mockResolvedValue({
        blockNumber: 0,
        balances: {},
      });
    });

    it("queries address balances when balances are needed", async () => {
      await service.findFullAddress(blockchainAddress, true);
      expect(balanceService.getBalances).toHaveBeenCalledTimes(1);
      expect(balanceService.getBalances).toHaveBeenCalledWith(blockchainAddress);
    });

    it("does not query address balances when balances are disabled", async () => {
      await service.findFullAddress(blockchainAddress, false);
      expect(balanceService.getBalances).not.toHaveBeenCalled();
    });

    describe("when contract address exists", () => {
      const transactionHash = "0x" + "b".repeat(64);
      const creatorAddress = "0x" + "c".repeat(40);
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
          blockNumber: 20,
          bytecode: "0x123",
          createdInBlockNumber: 30,
          creatorTxHash: transactionHash,
          creatorAddress,
          isEvmLike: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        repositoryMock.findOneBy.mockReturnValue(Promise.resolve(addressRecord));
        transactionService.count.mockResolvedValue(totalTxCount);
        balanceService.getBalances.mockResolvedValue(addressBalances);
      });

      it("queries totalTransactions value from transaction receipt repo with formatted contractAddress", async () => {
        await service.findFullAddress(blockchainAddress, true);
        expect(transactionService.count).toHaveBeenCalledTimes(1);
        expect(transactionService.count).toHaveBeenCalledWith({
          "from|to": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        });
      });

      it("returns the contract address record", async () => {
        const result = await service.findFullAddress(blockchainAddress, true);
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
          balanceService.getBalances.mockResolvedValue(defaultBalancesResponse);
        });

        it("returns the contract address record with empty balances and block number from the address record", async () => {
          const result = await service.findFullAddress(blockchainAddress, true);
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
          repositoryMock.findOneBy.mockResolvedValue(null);
          transactionService.getAccountNonce.mockResolvedValueOnce(sealedNonce).mockResolvedValueOnce(verifiedNonce);
          balanceService.getBalances.mockResolvedValue(addressBalances);
        });

        it("queries account sealed and verified nonce", async () => {
          await service.findFullAddress(blockchainAddress, true);
          expect(transactionService.getAccountNonce).toHaveBeenCalledTimes(2);
          expect(transactionService.getAccountNonce).toHaveBeenCalledWith({ accountAddress: blockchainAddress });
          expect(transactionService.getAccountNonce).toHaveBeenCalledWith({
            accountAddress: blockchainAddress,
            isVerified: true,
          });
        });

        it("queries account balances", async () => {
          await service.findFullAddress(blockchainAddress, true);
          expect(balanceService.getBalances).toHaveBeenCalledTimes(1);
          expect(balanceService.getBalances).toHaveBeenCalledWith(blockchainAddress);
        });

        it("returns the account address record", async () => {
          const result = await service.findFullAddress(blockchainAddress, true);
          expect(result).toStrictEqual({
            type: AddressType.Account,
            address: getAddress(blockchainAddress),
            blockNumber: addressBalances.blockNumber,
            balances: addressBalances.balances,
            sealedNonce,
            verifiedNonce,
          });
        });
      });

      describe("when balances do not exist", () => {
        const blockNumber = 30;
        beforeEach(() => {
          repositoryMock.find.mockClear();
          repositoryMock.findOneBy.mockResolvedValueOnce(null);
          blockService.getLastBlockNumber.mockResolvedValueOnce(blockNumber);
          balanceService.getBalances.mockResolvedValue({
            blockNumber: 0,
            balances: {},
          });
        });

        it("returns the default account address response", async () => {
          const result = await service.findFullAddress(blockchainAddress, true);
          expect(result).toStrictEqual({
            type: AddressType.Account,
            address: getAddress(blockchainAddress),
            blockNumber,
            balances: {},
            sealedNonce: 0,
            verifiedNonce: 0,
          });
        });
      });
    });
  });
});
