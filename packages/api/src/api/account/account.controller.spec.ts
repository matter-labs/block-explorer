import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { BadRequestException, Logger } from "@nestjs/common";
import { L2_ETH_TOKEN_ADDRESS } from "../../common/constants";
import { BlockService } from "../../block/block.service";
import { BlockDetails } from "../../block/blockDetails.entity";
import { TransactionService } from "../../transaction/transaction.service";
import { BalanceService } from "../../balance/balance.service";
import { TransactionStatus } from "../../transaction/entities/transaction.entity";
import { AddressTransaction } from "../../transaction/entities/addressTransaction.entity";
import { TokenType } from "../../token/token.entity";
import { Transfer } from "../../transfer/transfer.entity";
import { TransferService } from "../../transfer/transfer.service";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { SortingOrder } from "../../common/types";
import { AccountController, parseAddressListPipeExceptionFactory } from "./account.controller";

describe("AccountController", () => {
  let controller: AccountController;
  let blockServiceMock: BlockService;
  let transactionServiceMock: TransactionService;
  let transferServiceMock: TransferService;
  let balanceServiceMock: BalanceService;

  const address = "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C";
  const addressTransaction = {
    transaction: {
      blockNumber: 20,
      receivedAt: new Date("2023-01-01"),
      hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
      nonce: 1,
      blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
      transactionIndex: 10,
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
      value: "1000000",
      gasLimit: "1100000",
      gasPrice: "100",
      status: TransactionStatus.Failed,
      receiptStatus: 1,
      data: "0x",
      fee: "0x0",
      commitTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b1",
      proveTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b2",
      executeTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b3",
      isL1Originated: true,
      l1BatchNumber: 3,
      transactionReceipt: {
        contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
        cumulativeGasUsed: "1200000",
        gasUsed: "900000",
      },
      type: 255,
    },
  };

  const ecr20Transfer = {
    blockNumber: 20,
    timestamp: new Date("2023-01-01"),
    transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
    from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
    to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
    amount: "1000000",
    tokenAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe36A",
    token: {
      name: "Token",
      symbol: "TKN",
      decimals: 18,
    },
    transaction: {
      blockNumber: 20,
      receivedAt: new Date("2023-01-01"),
      hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
      nonce: 1,
      blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
      transactionIndex: 10,
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
      value: "0",
      gasLimit: "1100000",
      gasPrice: "100",
      status: TransactionStatus.Failed,
      receiptStatus: 1,
      data: "0x",
      fee: "0x0",
      commitTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b1",
      proveTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b2",
      executeTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b3",
      isL1Originated: true,
      l1BatchNumber: 3,
      transactionReceipt: {
        contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
        cumulativeGasUsed: "1200000",
        gasUsed: "900000",
      },
      type: 255,
    },
  } as Transfer;

  const erc721Transfer = {
    ...ecr20Transfer,
    fields: {
      tokenId: "123",
    },
  } as unknown as Transfer;

  beforeEach(async () => {
    blockServiceMock = mock<BlockService>({
      getLastBlockNumber: jest.fn().mockResolvedValue(100),
      findMany: jest.fn().mockResolvedValue([]),
    });
    transactionServiceMock = mock<TransactionService>({
      findByAddress: jest.fn().mockResolvedValue([]),
    });
    transferServiceMock = mock<TransferService>({
      findTokenTransfers: jest.fn().mockResolvedValue([]),
      findInternalTransfers: jest.fn().mockResolvedValue([]),
    });
    balanceServiceMock = mock<BalanceService>({
      getBalance: jest.fn().mockResolvedValue("1000"),
      getBalancesByAddresses: jest.fn().mockResolvedValue([
        {
          address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
          balance: "10000",
        },
      ]),
    });
    const module = await Test.createTestingModule({
      controllers: [AccountController],
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
          provide: TransferService,
          useValue: transferServiceMock,
        },
        {
          provide: BalanceService,
          useValue: balanceServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    controller = module.get<AccountController>(AccountController);
  });

  describe("getAccountTransactions", () => {
    it("calls block service to get latest block number", async () => {
      await controller.getAccountTransactions(
        address,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(blockServiceMock.getLastBlockNumber).toBeCalledTimes(1);
    });

    it("calls transaction service to get transactions by address", async () => {
      await controller.getAccountTransactions(
        address,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc },
        11,
        12
      );
      expect(transactionServiceMock.findByAddress).toBeCalledWith(address, {
        startBlock: 11,
        endBlock: 12,
        page: 2,
        offset: 20,
        sort: SortingOrder.Asc,
        maxLimit: 10000,
      });
      expect(transactionServiceMock.findByAddress).toBeCalledTimes(1);
    });

    it("returns not ok response when no transactions found", async () => {
      const response = await controller.getAccountTransactions(
        address,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NO_TRANSACTIONS_FOUND,
        result: [],
      });
    });

    it("returns transactions list when transactions are found by address", async () => {
      jest.spyOn(transactionServiceMock, "findByAddress").mockResolvedValue([addressTransaction as AddressTransaction]);

      const response = await controller.getAccountTransactions(
        address,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: [
          {
            blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
            blockNumber: "20",
            commitTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b1",
            confirmations: "80",
            contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
            cumulativeGasUsed: "1200000",
            executeTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b3",
            fee: "0",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            functionName: "",
            gas: "1100000",
            gasPrice: "100",
            gasUsed: "900000",
            hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
            input: "0x",
            isError: "1",
            isL1Originated: "1",
            l1BatchNumber: "3",
            methodId: "0x",
            nonce: "1",
            proveTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b2",
            timeStamp: "1672531200",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
            transactionIndex: "10",
            txreceipt_status: "1",
            value: "1000000",
            type: "255",
          },
        ],
      });
    });
  });

  describe("getAccountInternalTransactions", () => {
    it("calls transfer service to get internal transfers", async () => {
      await controller.getAccountInternalTransactions(
        address,
        "",
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc },
        11,
        12
      );
      expect(transferServiceMock.findInternalTransfers).toBeCalledWith({
        address,
        transactionHash: "",
        startBlock: 11,
        endBlock: 12,
        page: 2,
        offset: 20,
        sort: SortingOrder.Asc,
        maxLimit: 10000,
      });
      expect(transferServiceMock.findInternalTransfers).toBeCalledTimes(1);
    });

    it("returns not ok response when no transactions found", async () => {
      const response = await controller.getAccountInternalTransactions(
        address,
        null,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NO_TRANSACTIONS_FOUND,
        result: [],
      });
    });

    it("returns internal transactions list when transactions are found", async () => {
      jest.spyOn(transferServiceMock, "findInternalTransfers").mockResolvedValue([ecr20Transfer as Transfer]);

      const response = await controller.getAccountInternalTransactions(
        address,
        null,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: [
          {
            blockNumber: "20",
            contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
            errCode: "",
            fee: "0",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            gas: "1100000",
            gasUsed: "900000",
            hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
            input: "",
            isError: "1",
            l1BatchNumber: "3",
            timeStamp: "1672531200",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
            traceId: "0",
            type: "call",
            value: "1000000",
            transactionType: "255",
          },
        ],
      });
    });
  });

  describe("getAccountTokenTransfers", () => {
    it("calls block service to get latest block number", async () => {
      await controller.getAccountTokenTransfers(
        address,
        null,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(blockServiceMock.getLastBlockNumber).toBeCalledTimes(1);
    });

    it("calls transfers service to get token transfers", async () => {
      await controller.getAccountTokenTransfers(
        address,
        "contractAddress",
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc },
        11,
        12
      );
      expect(transferServiceMock.findTokenTransfers).toBeCalledWith({
        tokenType: TokenType.ERC20,
        address,
        tokenAddress: "contractAddress",
        startBlock: 11,
        endBlock: 12,
        page: 2,
        offset: 20,
        sort: SortingOrder.Asc,
        maxLimit: 10000,
      });
      expect(transferServiceMock.findTokenTransfers).toBeCalledTimes(1);
    });

    it("returns not ok response when no transfers found", async () => {
      const response = await controller.getAccountTokenTransfers(
        address,
        "tokenAddress",
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NO_TRANSACTIONS_FOUND,
        result: [],
      });
    });

    it("returns transfers list when transfers are found", async () => {
      jest.spyOn(transferServiceMock, "findTokenTransfers").mockResolvedValue([ecr20Transfer]);

      const response = await controller.getAccountTokenTransfers(
        address,
        "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe36A",
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: [
          {
            blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
            blockNumber: "20",
            confirmations: "80",
            contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe36A",
            cumulativeGasUsed: "1200000",
            fee: "0",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            gas: "1100000",
            gasPrice: "100",
            gasUsed: "900000",
            hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
            input: "0x",
            l1BatchNumber: "3",
            nonce: "1",
            timeStamp: "1672531200",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
            tokenDecimal: "18",
            tokenName: "Token",
            tokenSymbol: "TKN",
            transactionIndex: "10",
            value: "1000000",
            transactionType: "255",
          },
        ],
      });
    });
  });

  describe("getAccountNFTTransfers", () => {
    it("calls block service to get latest block number", async () => {
      await controller.getAccountNFTTransfers(
        address,
        null,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(blockServiceMock.getLastBlockNumber).toBeCalledTimes(1);
    });

    it("calls transfers service to get token transfers", async () => {
      await controller.getAccountNFTTransfers(
        address,
        "contractAddress",
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc },
        11,
        12
      );
      expect(transferServiceMock.findTokenTransfers).toBeCalledWith({
        tokenType: TokenType.ERC721,
        address,
        tokenAddress: "contractAddress",
        startBlock: 11,
        endBlock: 12,
        page: 2,
        offset: 20,
        sort: SortingOrder.Asc,
        maxLimit: 10000,
      });
      expect(transferServiceMock.findTokenTransfers).toBeCalledTimes(1);
    });

    it("returns not ok response when no transfers found", async () => {
      const response = await controller.getAccountNFTTransfers(
        address,
        "tokenAddress",
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NO_TRANSACTIONS_FOUND,
        result: [],
      });
    });

    it("returns transfers list when transfers are found", async () => {
      jest.spyOn(transferServiceMock, "findTokenTransfers").mockResolvedValue([erc721Transfer]);

      const response = await controller.getAccountNFTTransfers(
        address,
        "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe36A",
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        { sort: SortingOrder.Asc }
      );
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: [
          {
            blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
            blockNumber: "20",
            confirmations: "80",
            contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe36A",
            cumulativeGasUsed: "1200000",
            fee: "0",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            gas: "1100000",
            gasPrice: "100",
            gasUsed: "900000",
            hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
            input: "0x",
            l1BatchNumber: "3",
            nonce: "1",
            timeStamp: "1672531200",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
            tokenDecimal: "18",
            tokenID: "123",
            tokenName: "Token",
            tokenSymbol: "TKN",
            transactionIndex: "10",
            value: "1000000",
            transactionType: "255",
          },
        ],
      });
    });
  });

  describe("getAccountEtherBalance", () => {
    it("calls balanceService.getBalance and returns account ether balance", async () => {
      const response = await controller.getAccountEtherBalance(address);
      expect(balanceServiceMock.getBalance).toBeCalledWith(address, L2_ETH_TOKEN_ADDRESS);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: "1000",
      });
    });
  });

  describe("getAccountTokenBalance", () => {
    it("calls balanceService.getBalance and returns account token balance", async () => {
      const response = await controller.getAccountTokenBalance(address, "tokenAddress");
      expect(balanceServiceMock.getBalance).toBeCalledWith(address, "tokenAddress");
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: "1000",
      });
    });
  });

  describe("getAccountsEtherBalances", () => {
    it("throws error when called with more than 20 addresses", async () => {
      const addresses = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21".split(",");
      await expect(controller.getAccountsEtherBalances(addresses)).rejects.toThrowError(
        new BadRequestException("Maximum 20 addresses per request")
      );
    });

    it("calls balanceService.getBalancesByAddresses and returns accounts ether balances", async () => {
      const response = await controller.getAccountsEtherBalances([address, "address2"]);
      expect(balanceServiceMock.getBalancesByAddresses).toBeCalledWith([address, "address2"], L2_ETH_TOKEN_ADDRESS);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: [
          {
            account: address,
            balance: "10000",
          },
          {
            account: "address2",
            balance: "0",
          },
        ],
      });
    });
  });

  describe("parseAddressListPipeExceptionFactory", () => {
    it("returns new BadRequestException with message", () => {
      expect(parseAddressListPipeExceptionFactory()).toEqual(new BadRequestException("Error! Missing address"));
    });
  });

  describe("getAccountMinedBlocks", () => {
    it("returns not ok response when no blocks by miner found", async () => {
      const response = await controller.getAccountMinedBlocks(address, {
        page: 1,
        offset: 10,
        maxLimit: 100,
      });
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NO_TRANSACTIONS_FOUND,
        result: [],
      });
    });

    it("returns blocks list response when block by miner are found", async () => {
      jest
        .spyOn(blockServiceMock, "findMany")
        .mockResolvedValue([{ number: 1, timestamp: new Date("2023-03-03") } as BlockDetails]);
      const response = await controller.getAccountMinedBlocks(address, {
        page: 1,
        offset: 10,
        maxLimit: 100,
      });
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: [
          {
            blockNumber: "1",
            timeStamp: "1677801600",
            blockReward: "0",
          },
        ],
      });
    });
  });
});
