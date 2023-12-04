import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { types } from "zksync-web3";
import { TransactionRepository, TransactionReceiptRepository } from "../repositories";
import { BlockchainService, TraceTransactionResult } from "../blockchain";
import { TransactionProcessor } from "./transaction.processor";
import { LogProcessor } from "../log";

describe("TransactionProcessor", () => {
  let transactionProcessor: TransactionProcessor;
  let blockchainServiceMock: BlockchainService;
  let logProcessorMock: LogProcessor;
  let transactionRepositoryMock: TransactionRepository;
  let transactionReceiptRepositoryMock: TransactionReceiptRepository;

  let startTxProcessingDurationMetricMock: jest.Mock;
  let stopTxProcessingDurationMetricMock: jest.Mock;

  let startGetTransactionInfoDurationMetricMock: jest.Mock;
  let stopGetTransactionInfoDurationMetricMock: jest.Mock;

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>();
    logProcessorMock = mock<LogProcessor>();
    transactionRepositoryMock = mock<TransactionRepository>();
    transactionReceiptRepositoryMock = mock<TransactionReceiptRepository>();

    stopTxProcessingDurationMetricMock = jest.fn();
    startTxProcessingDurationMetricMock = jest.fn().mockReturnValue(stopTxProcessingDurationMetricMock);

    stopGetTransactionInfoDurationMetricMock = jest.fn();
    startGetTransactionInfoDurationMetricMock = jest.fn().mockReturnValue(stopGetTransactionInfoDurationMetricMock);

    const app = await Test.createTestingModule({
      providers: [
        TransactionProcessor,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: LogProcessor,
          useValue: logProcessorMock,
        },
        {
          provide: TransactionRepository,
          useValue: transactionRepositoryMock,
        },
        {
          provide: TransactionReceiptRepository,
          useValue: transactionReceiptRepositoryMock,
        },
        {
          provide: "PROM_METRIC_TRANSACTION_PROCESSING_DURATION_SECONDS",
          useValue: {
            startTimer: startTxProcessingDurationMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_GET_TRANSACTION_INFO_DURATION_SECONDS",
          useValue: {
            startTimer: startGetTransactionInfoDurationMetricMock,
          },
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    transactionProcessor = app.get<TransactionProcessor>(TransactionProcessor);
  });

  describe("add", () => {
    const blockDetails = mock<types.BlockDetails>({
      number: 1,
      l1BatchNumber: 3,
    });
    const transaction = mock<types.TransactionResponse>({ hash: "0" });
    const transactionReceipt = mock<types.TransactionReceipt>({
      transactionIndex: 0,
      logs: [mock<types.Log>(), mock<types.Log>()],
      status: 1,
    });
    const transactionDetails = mock<types.TransactionDetails>();
    const traceTransactionResult = mock<TraceTransactionResult>({
      error: "Some error",
      revertReason: "Some revert reason",
    });

    beforeEach(() => {
      jest.spyOn(blockchainServiceMock, "getTransaction").mockResolvedValue(transaction);
      jest.spyOn(blockchainServiceMock, "getTransactionReceipt").mockResolvedValue(transactionReceipt);
      jest.spyOn(blockchainServiceMock, "getTransactionDetails").mockResolvedValue(transactionDetails);
      jest.spyOn(blockchainServiceMock, "debugTraceTransaction").mockResolvedValue(traceTransactionResult);
    });

    it("starts the transaction duration metric", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(startTxProcessingDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("starts the get info transaction duration metric", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(stopGetTransactionInfoDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("reads transaction data by hash", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(blockchainServiceMock.getTransaction).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.getTransaction).toHaveBeenCalledWith(transaction.hash);
    });

    it("reads transaction details by hash", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(blockchainServiceMock.getTransactionDetails).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.getTransactionDetails).toHaveBeenCalledWith(transaction.hash);
    });

    it("reads transaction receipt by hash", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(blockchainServiceMock.getTransactionReceipt).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.getTransactionReceipt).toHaveBeenCalledWith(transaction.hash);
    });

    it("stops the get info transaction duration metric", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(stopGetTransactionInfoDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("throws error if transaction data by hash API returns null", async () => {
      jest.spyOn(blockchainServiceMock, "getTransaction").mockResolvedValue(null);
      await expect(transactionProcessor.add(transaction.hash, blockDetails)).rejects.toThrowError(
        new Error(`Some of the blockchain transaction APIs returned null for a transaction ${transaction.hash}`)
      );
    });

    it("throws error if transaction details by hash API returns null", async () => {
      jest.spyOn(blockchainServiceMock, "getTransactionDetails").mockResolvedValue(null);
      await expect(transactionProcessor.add(transaction.hash, blockDetails)).rejects.toThrowError(
        new Error(`Some of the blockchain transaction APIs returned null for a transaction ${transaction.hash}`)
      );
    });

    it("throws error if transaction receipt by hash API returns null", async () => {
      jest.spyOn(blockchainServiceMock, "getTransactionReceipt").mockResolvedValue(null);
      await expect(transactionProcessor.add(transaction.hash, blockDetails)).rejects.toThrowError(
        new Error(`Some of the blockchain transaction APIs returned null for a transaction ${transaction.hash}`)
      );
    });

    it("adds the transaction info", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(transactionRepositoryMock.add).toHaveBeenCalledTimes(1);
      expect(transactionRepositoryMock.add).toHaveBeenCalledWith({
        ...transaction,
        ...transactionDetails,
        l1BatchNumber: blockDetails.l1BatchNumber,
        receiptStatus: transactionReceipt.status,
      });
    });

    it("adds the transaction receipt", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(transactionReceiptRepositoryMock.add).toHaveBeenCalledTimes(1);
      expect(transactionReceiptRepositoryMock.add).toHaveBeenCalledWith(transactionReceipt);
    });

    it("process transaction logs", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(logProcessorMock.process).toHaveBeenCalledTimes(1);
      expect(logProcessorMock.process).toHaveBeenCalledWith(
        transactionReceipt.logs,
        blockDetails,
        transactionDetails,
        transactionReceipt
      );
    });

    it("stops the transaction duration metric", async () => {
      await transactionProcessor.add(transaction.hash, blockDetails);
      expect(stopTxProcessingDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    describe("when transaction has failed status", () => {
      beforeEach(() => {
        (blockchainServiceMock.getTransactionReceipt as jest.Mock).mockResolvedValueOnce({
          transactionIndex: 0,
          logs: [],
          status: 0,
        });
      });

      it("reads transaction trace", async () => {
        await transactionProcessor.add(transaction.hash, blockDetails);
        expect(blockchainServiceMock.debugTraceTransaction).toHaveBeenCalledTimes(1);
        expect(blockchainServiceMock.debugTraceTransaction).toHaveBeenCalledWith(transaction.hash, true);
      });

      describe("when transaction trace contains error and revert reason", () => {
        it("adds the transaction info with error and revert reason", async () => {
          await transactionProcessor.add(transaction.hash, blockDetails);
          expect(transactionRepositoryMock.add).toHaveBeenCalledTimes(1);
          expect(transactionRepositoryMock.add).toHaveBeenCalledWith({
            ...transaction,
            ...transactionDetails,
            l1BatchNumber: blockDetails.l1BatchNumber,
            receiptStatus: 0,
            error: traceTransactionResult.error,
            revertReason: traceTransactionResult.revertReason,
          });
        });
      });

      describe("when transaction trace doe not contain error and revert reason", () => {
        it("adds the transaction info without error and revert reason", async () => {
          (blockchainServiceMock.debugTraceTransaction as jest.Mock).mockResolvedValueOnce(null);
          await transactionProcessor.add(transaction.hash, blockDetails);
          expect(transactionRepositoryMock.add).toHaveBeenCalledTimes(1);
          expect(transactionRepositoryMock.add).toHaveBeenCalledWith({
            ...transaction,
            ...transactionDetails,
            l1BatchNumber: blockDetails.l1BatchNumber,
            receiptStatus: 0,
          });
        });
      });
    });
  });
});
