import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import {
  TransactionRepository,
  TransactionReceiptRepository,
  TransferRepository,
  AddressRepository,
  TokenRepository,
  LogRepository,
} from "../repositories";
import { TransactionProcessor } from "./transaction.processor";
import { TransactionData } from "../dataFetcher/types";

describe("TransactionProcessor", () => {
  let transactionProcessor: TransactionProcessor;
  let transactionRepositoryMock: TransactionRepository;
  let transactionReceiptRepositoryMock: TransactionReceiptRepository;
  let transferRepositoryMock: TransferRepository;
  let addressRepositoryMock: AddressRepository;
  let tokenRepositoryMock: TokenRepository;
  let logRepositoryMock: LogRepository;

  let startTxProcessingDurationMetricMock: jest.Mock;
  let stopTxProcessingDurationMetricMock: jest.Mock;

  beforeEach(async () => {
    transactionRepositoryMock = mock<TransactionRepository>();
    transactionReceiptRepositoryMock = mock<TransactionReceiptRepository>();
    transferRepositoryMock = mock<TransferRepository>();
    addressRepositoryMock = mock<AddressRepository>();
    tokenRepositoryMock = mock<TokenRepository>();
    logRepositoryMock = mock<LogRepository>();

    stopTxProcessingDurationMetricMock = jest.fn();
    startTxProcessingDurationMetricMock = jest.fn().mockReturnValue(stopTxProcessingDurationMetricMock);

    const app = await Test.createTestingModule({
      providers: [
        TransactionProcessor,
        {
          provide: TransactionRepository,
          useValue: transactionRepositoryMock,
        },
        {
          provide: TransactionReceiptRepository,
          useValue: transactionReceiptRepositoryMock,
        },
        {
          provide: LogRepository,
          useValue: logRepositoryMock,
        },
        {
          provide: TransferRepository,
          useValue: transferRepositoryMock,
        },
        {
          provide: AddressRepository,
          useValue: addressRepositoryMock,
        },
        {
          provide: TokenRepository,
          useValue: tokenRepositoryMock,
        },
        {
          provide: "PROM_METRIC_TRANSACTION_PROCESSING_DURATION_SECONDS",
          useValue: {
            startTimer: startTxProcessingDurationMetricMock,
          },
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    transactionProcessor = app.get<TransactionProcessor>(TransactionProcessor);
  });

  describe("add", () => {
    const blockNumber = 10;
    const transactionData = {
      transaction: {
        hash: "transactionHash",
        receivedAt: "2023-12-29T06:52:51.438Z",
        type: 3,
      },
      transactionReceipt: {
        hash: "transactionHash",
        logs: [
          { index: 0, topics: [] },
          { index: 1, topics: [] },
        ],
        index: 1,
        gasPrice: "100",
      },
      transfers: [{ logIndex: 2 }, { logIndex: 3 }],
      contractAddresses: [
        {
          address: "address1",
          bytecode: "bytecode1",
          blockNumber: 1,
          transactionHash: "transactionHash1",
          creatorAddress: "creatorAddress1",
          logIndex: 1,
        },
        {
          address: "address2",
          bytecode: "bytecode2",
          blockNumber: 2,
          transactionHash: "transactionHash2",
          creatorAddress: "creatorAddress2",
          logIndex: 2,
        },
      ],
      tokens: [{ l2Address: "l2Address1" }, { l2Address: "l2Address2" }],
    } as unknown as TransactionData;

    it("starts the transaction duration metric", async () => {
      await transactionProcessor.add(blockNumber, transactionData);
      expect(startTxProcessingDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("saves transaction to the DB", async () => {
      await transactionProcessor.add(blockNumber, transactionData);
      expect(transactionRepositoryMock.add).toHaveBeenCalledTimes(1);
      expect(transactionRepositoryMock.add).toHaveBeenCalledWith(transactionData.transaction);
    });

    it("saves transaction receipt to the DB", async () => {
      await transactionProcessor.add(blockNumber, transactionData);
      expect(transactionReceiptRepositoryMock.add).toHaveBeenCalledTimes(1);
      expect(transactionReceiptRepositoryMock.add).toHaveBeenCalledWith({
        ...transactionData.transactionReceipt,
        transactionIndex: transactionData.transactionReceipt.index,
        transactionHash: transactionData.transactionReceipt.hash,
        effectiveGasPrice: transactionData.transactionReceipt.gasPrice,
        type: transactionData.transaction.type,
      });
    });

    it("saves transaction logs to the DB", async () => {
      await transactionProcessor.add(blockNumber, transactionData);
      expect(logRepositoryMock.addMany).toHaveBeenCalledTimes(1);
      expect(logRepositoryMock.addMany).toHaveBeenCalledWith(
        transactionData.transactionReceipt.logs.map((log) => ({
          ...log,
          timestamp: transactionData.transaction.receivedAt,
          topics: [],
          logIndex: log.index,
        }))
      );
    });

    it("saves transaction transfers to the DB", async () => {
      await transactionProcessor.add(blockNumber, transactionData);
      expect(transferRepositoryMock.addMany).toHaveBeenCalledTimes(1);
      expect(transferRepositoryMock.addMany).toHaveBeenCalledWith(transactionData.transfers);
    });

    it("saves contract addresses to the DB", async () => {
      await transactionProcessor.add(blockNumber, transactionData);
      expect(addressRepositoryMock.upsert).toHaveBeenCalledTimes(2);
      expect(addressRepositoryMock.upsert).toHaveBeenNthCalledWith(1, {
        address: "address1",
        bytecode: "bytecode1",
        createdInBlockNumber: 1,
        createdInLogIndex: 1,
        creatorAddress: "creatorAddress1",
        creatorTxHash: "transactionHash1",
      });

      expect(addressRepositoryMock.upsert).toHaveBeenNthCalledWith(2, {
        address: "address2",
        bytecode: "bytecode2",
        createdInBlockNumber: 2,
        createdInLogIndex: 2,
        creatorAddress: "creatorAddress2",
        creatorTxHash: "transactionHash2",
      });
    });

    it("saves tokens to the DB", async () => {
      await transactionProcessor.add(blockNumber, transactionData);
      expect(tokenRepositoryMock.upsert).toHaveBeenCalledTimes(2);
      expect(tokenRepositoryMock.upsert).toHaveBeenNthCalledWith(1, transactionData.tokens[0]);
      expect(tokenRepositoryMock.upsert).toHaveBeenNthCalledWith(2, transactionData.tokens[1]);
    });

    it("stops the transaction duration metric", async () => {
      await transactionProcessor.add(blockNumber, transactionData);
      expect(stopTxProcessingDurationMetricMock).toHaveBeenCalledTimes(1);
    });
  });
});
