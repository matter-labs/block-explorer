import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { types } from "zksync-ethers";
import { BlockchainService } from "../blockchain";
import { TransactionService, TransactionTracesService, ContractAddress, TransactionTraceData } from "./";
import { LogService } from "../log";
import { Token } from "../token/token.service";
import { Transfer } from "../transfer/interfaces/transfer.interface";

describe("TransactionService", () => {
  let transactionService: TransactionService;
  let blockchainServiceMock: BlockchainService;
  let transactionTracesServiceMock: TransactionTracesService;
  let logServiceMock: LogService;

  let startTxProcessingDurationMetricMock: jest.Mock;
  let stopTxProcessingDurationMetricMock: jest.Mock;

  let startGetTransactionInfoDurationMetricMock: jest.Mock;
  let stopGetTransactionInfoDurationMetricMock: jest.Mock;

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>();
    logServiceMock = mock<LogService>();
    transactionTracesServiceMock = mock<TransactionTracesService>();

    stopTxProcessingDurationMetricMock = jest.fn();
    startTxProcessingDurationMetricMock = jest.fn().mockReturnValue(stopTxProcessingDurationMetricMock);

    stopGetTransactionInfoDurationMetricMock = jest.fn();
    startGetTransactionInfoDurationMetricMock = jest.fn().mockReturnValue(stopGetTransactionInfoDurationMetricMock);

    const app = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: TransactionTracesService,
          useValue: transactionTracesServiceMock,
        },
        {
          provide: LogService,
          useValue: logServiceMock,
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

    transactionService = app.get<TransactionService>(TransactionService);
  });

  describe("getData", () => {
    const blockDetails = mock<types.BlockDetails>({
      number: 1,
    });
    const transaction = mock<types.TransactionResponse>({ hash: "0" });
    const transactionReceipt = mock<types.TransactionReceipt>({
      index: 0,
      logs: [mock<types.Log>(), mock<types.Log>()],
      status: 1,
    });
    const transactionDetails = mock<types.TransactionDetails>();

    const transactionTraceData = {
      error: "Some error",
      revertReason: "Some revert reason",
      contractAddresses: [
        mock<ContractAddress>({
          address: "0x1234567890abcdef1234567890abcdef12345678",
        }),
        mock<ContractAddress>({
          address: "0xabcdef1234567890abcdef1234567890abcdef12",
        }),
      ],
      tokens: [
        mock<Token>({
          l2Address: "0xabcdef1234567890abcdef1234567890abcdef12",
        }),
        mock<Token>({
          l2Address: "0x1234567890abcdef1234567890abcdef12345678",
        }),
      ],
      transfers: [
        {
          from: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
          to: "0x1234567890abcdef1234567890abcdef12345678",
        } as Transfer,
        {
          from: "0x1234567890abcdef1234567890abcdef12345678",
          to: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
        } as Transfer,
      ],
    } as TransactionTraceData;

    const logsData = {
      transfers: [
        {
          from: "0xdefdefdefdefdefdefdefdefdefdefdefdef",
          to: "0x234567890abcdef1234567890abcdef12345678",
        } as Transfer,
        {
          from: "0x234567890abcdef1234567890abcdef12345678",
          to: "0xdefdefdefdefdefdefdefdefdefdefdefdef",
        } as Transfer,
      ],
    };

    beforeEach(() => {
      jest.spyOn(blockchainServiceMock, "getTransaction").mockResolvedValue(transaction);
      jest.spyOn(blockchainServiceMock, "getTransactionReceipt").mockResolvedValue(transactionReceipt);
      jest.spyOn(blockchainServiceMock, "getTransactionDetails").mockResolvedValue(transactionDetails);
      jest.spyOn(transactionTracesServiceMock, "getData").mockResolvedValue(transactionTraceData);
      jest.spyOn(logServiceMock, "getData").mockResolvedValue(logsData);
    });

    it("starts the transaction duration metric", async () => {
      await transactionService.getData(transaction.hash, blockDetails);
      expect(startTxProcessingDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("starts the get info transaction duration metric", async () => {
      await transactionService.getData(transaction.hash, blockDetails);
      expect(stopGetTransactionInfoDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("reads transaction data by hash", async () => {
      await transactionService.getData(transaction.hash, blockDetails);
      expect(blockchainServiceMock.getTransaction).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.getTransaction).toHaveBeenCalledWith(transaction.hash);
    });

    it("reads transaction details by hash", async () => {
      await transactionService.getData(transaction.hash, blockDetails);
      expect(blockchainServiceMock.getTransactionDetails).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.getTransactionDetails).toHaveBeenCalledWith(transaction.hash);
    });

    it("reads transaction receipt by hash", async () => {
      await transactionService.getData(transaction.hash, blockDetails);
      expect(blockchainServiceMock.getTransactionReceipt).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.getTransactionReceipt).toHaveBeenCalledWith(transaction.hash);
    });

    it("stops the get info transaction duration metric", async () => {
      await transactionService.getData(transaction.hash, blockDetails);
      expect(stopGetTransactionInfoDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("throws error if transaction data by hash API returns null", async () => {
      jest.spyOn(blockchainServiceMock, "getTransaction").mockResolvedValue(null);
      await expect(transactionService.getData(transaction.hash, blockDetails)).rejects.toThrowError(
        new Error(`Some of the blockchain transaction APIs returned null for a transaction ${transaction.hash}`)
      );
    });

    it("throws error if transaction details by hash API returns null", async () => {
      jest.spyOn(blockchainServiceMock, "getTransactionDetails").mockResolvedValue(null);
      await expect(transactionService.getData(transaction.hash, blockDetails)).rejects.toThrowError(
        new Error(`Some of the blockchain transaction APIs returned null for a transaction ${transaction.hash}`)
      );
    });

    it("throws error if transaction receipt by hash API returns null", async () => {
      jest.spyOn(blockchainServiceMock, "getTransactionReceipt").mockResolvedValue(null);
      await expect(transactionService.getData(transaction.hash, blockDetails)).rejects.toThrowError(
        new Error(`Some of the blockchain transaction APIs returned null for a transaction ${transaction.hash}`)
      );
    });

    it("calls log service with correct data", async () => {
      await transactionService.getData(transaction.hash, blockDetails);
      expect(logServiceMock.getData).toHaveBeenCalledTimes(1);
      expect(logServiceMock.getData).toHaveBeenCalledWith(
        transactionReceipt.logs,
        blockDetails,
        transactionTraceData.transfers,
        transactionDetails,
        transactionReceipt
      );
    });

    it("returns data with transaction info", async () => {
      const txData = await transactionService.getData(transaction.hash, blockDetails);
      expect(txData.transaction).toEqual({
        ...transaction,
        ...transactionDetails,
        receiptStatus: transactionReceipt.status,
        to: undefined,
      });
    });

    it("returns data with transaction receipt", async () => {
      const txData = await transactionService.getData(transaction.hash, blockDetails);
      expect(txData.transactionReceipt).toEqual(transactionReceipt);
    });

    it("returns data with contract addresses", async () => {
      const txData = await transactionService.getData(transaction.hash, blockDetails);
      expect(txData.contractAddresses).toEqual(transactionTraceData.contractAddresses);
    });

    it("returns data with tokens", async () => {
      const txData = await transactionService.getData(transaction.hash, blockDetails);
      expect(txData.tokens).toEqual(transactionTraceData.tokens);
    });

    it("returns data with transfers", async () => {
      const txData = await transactionService.getData(transaction.hash, blockDetails);
      expect(txData.transfers).toEqual(logsData.transfers);
    });

    it("stops the transaction duration metric", async () => {
      await transactionService.getData(transaction.hash, blockDetails);
      expect(stopTxProcessingDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    describe("when transaction has failed status", () => {
      beforeEach(() => {
        (blockchainServiceMock.getTransactionReceipt as jest.Mock).mockResolvedValueOnce({
          index: 0,
          logs: [],
          status: 0,
        });
      });

      describe("when transaction trace contains error and revert reason", () => {
        it("returns data with transaction info with error and revert reason", async () => {
          const txData = await transactionService.getData(transaction.hash, blockDetails);
          expect(txData.transaction).toEqual({
            ...transaction,
            ...transactionDetails,
            receiptStatus: 0,
            error: transactionTraceData.error,
            revertReason: transactionTraceData.revertReason,
            to: undefined,
          });
        });
      });

      describe("when transaction trace does not contain error and revert reason", () => {
        it("returns data with transaction info without error and revert reason", async () => {
          (transactionTracesServiceMock.getData as jest.Mock).mockResolvedValueOnce({
            error: null,
            revertReason: null,
            contractAddresses: [],
            tokens: [],
          });
          const txData = await transactionService.getData(transaction.hash, blockDetails);
          expect(txData.transaction).toEqual({
            ...transaction,
            ...transactionDetails,
            receiptStatus: 0,
            error: null,
            revertReason: null,
          });
        });
      });
    });
  });
});
