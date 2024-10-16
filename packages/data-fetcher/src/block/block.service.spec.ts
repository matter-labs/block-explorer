import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { TransactionService } from "../transaction";
import { LogService } from "../log";
import { BlockchainService } from "../blockchain";
import { BalanceService } from "../balance";
import { BlockService } from "./";
import { TokenType } from "../token/token.service";

describe("BlockService", () => {
  let blockService: BlockService;
  let blockchainServiceMock: BlockchainService;
  let transactionServiceMock: TransactionService;
  let logServiceMock: LogService;
  let balanceServiceMock: BalanceService;

  let startGetBlockInfoDurationMetricMock: jest.Mock;
  let stopGetBlockInfoDurationMetricMock: jest.Mock;

  let startBlockDurationMetricMock: jest.Mock;
  let stopBlockDurationMetricMock: jest.Mock;

  let startBalancesDurationMetricMock: jest.Mock;
  let stopBalancesDurationMetricMock: jest.Mock;

  const getBlockService = async () => {
    const app = await Test.createTestingModule({
      providers: [
        BlockService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
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
          provide: "PROM_METRIC_BLOCK_PROCESSING_DURATION_SECONDS",
          useValue: {
            startTimer: startBlockDurationMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_BALANCES_PROCESSING_DURATION_SECONDS",
          useValue: {
            startTimer: startBalancesDurationMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_GET_BLOCK_INFO_DURATION_SECONDS",
          useValue: {
            startTimer: startGetBlockInfoDurationMetricMock,
          },
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    return app.get<BlockService>(BlockService);
  };

  const transactionData = [
    {
      transaction: {
        hash: "transactionHash1",
      },
    },
    {
      transaction: {
        hash: "transactionHash2",
      },
    },
  ];

  const blockLogData = {
    logs: [{ index: 0 }, { index: 1 }],
    transfers: [{ logIndex: 0 }, { logIndex: 1 }],
  };

  const blockInfoData = {
    hash: "hash",
    transactions: ["transactionHash1", "transactionHash2"],
  };

  const blockDetailsData = {
    blockHash: "blockHash",
  };

  const blockChangedBalances = [
    {
      address: "0x0000000000000000000000000000000000000000",
      blockNumber: 5,
      tokenAddress: "0x0000000000000000000000000000000000000000",
      balance: BigInt(1),
      tokenType: TokenType.BaseToken,
    },
  ];

  beforeEach(async () => {
    blockchainServiceMock = mock<BlockchainService>({
      getBlock: jest.fn().mockResolvedValue(blockInfoData),
      getBlockDetails: jest.fn().mockResolvedValue(blockDetailsData),
      getLogs: jest.fn().mockResolvedValue([]),
    });
    transactionServiceMock = mock<TransactionService>({
      getData: jest.fn().mockResolvedValueOnce(transactionData[0]).mockResolvedValueOnce(transactionData[1]),
    });
    logServiceMock = mock<LogService>({
      getData: jest.fn().mockResolvedValue(blockLogData),
    });
    balanceServiceMock = mock<BalanceService>({
      getChangedBalances: jest.fn().mockResolvedValueOnce(blockChangedBalances),
      clearTrackedState: jest.fn(),
    });

    stopGetBlockInfoDurationMetricMock = jest.fn();
    startGetBlockInfoDurationMetricMock = jest.fn().mockReturnValue(stopGetBlockInfoDurationMetricMock);

    stopBlockDurationMetricMock = jest.fn();
    startBlockDurationMetricMock = jest.fn().mockReturnValue(stopBlockDurationMetricMock);

    stopBalancesDurationMetricMock = jest.fn();
    startBalancesDurationMetricMock = jest.fn().mockReturnValue(stopBalancesDurationMetricMock);

    blockService = await getBlockService();
  });

  const blockNumber = 1;

  describe("getData", () => {
    it("starts the get block info metric", async () => {
      await blockService.getData(blockNumber);
      expect(startGetBlockInfoDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("returns data with block and block details info", async () => {
      const blockData = await blockService.getData(blockNumber);
      expect(blockchainServiceMock.getBlock).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.getBlock).toHaveBeenCalledWith(blockNumber);
      expect(blockchainServiceMock.getBlockDetails).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.getBlockDetails).toHaveBeenCalledWith(blockNumber);
      expect(blockData.block).toEqual(blockInfoData);
      expect(blockData.blockDetails).toEqual(blockDetailsData);
    });

    it("stops the get block info metric", async () => {
      await blockService.getData(blockNumber);
      expect(stopGetBlockInfoDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("starts the block processing duration metric", async () => {
      await blockService.getData(blockNumber);
      expect(startBlockDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("returns data with block info", async () => {
      const blockData = await blockService.getData(blockNumber);
      expect(blockData.block).toEqual(blockInfoData);
      expect(blockData.blockDetails).toEqual(blockDetailsData);
    });

    it("returns null if block does not exist in blockchain", async () => {
      (blockchainServiceMock.getBlock as jest.Mock).mockResolvedValue(null);
      const blockData = await blockService.getData(blockNumber);
      expect(blockData).toBeNull();
    });

    it("returns null if block details does not exist in blockchain", async () => {
      (blockchainServiceMock.getBlockDetails as jest.Mock).mockResolvedValue(null);
      const blockData = await blockService.getData(blockNumber);
      expect(blockData).toBeNull();
    });

    it("returns block transactions data", async () => {
      const blockData = await blockService.getData(blockNumber);
      expect(transactionServiceMock.getData).toHaveBeenCalledTimes(2);
      expect(transactionServiceMock.getData).toHaveBeenCalledWith(blockInfoData.transactions[0], blockDetailsData);
      expect(transactionServiceMock.getData).toHaveBeenCalledWith(blockInfoData.transactions[1], blockDetailsData);
      expect(blockData.transactions).toEqual(transactionData);
    });

    describe("when processing fails with an error", () => {
      beforeEach(() => {
        jest.spyOn(transactionServiceMock, "getData").mockReset();
        jest.spyOn(transactionServiceMock, "getData").mockRejectedValue(new Error("log service error"));
      });

      it("throws the generated error", async () => {
        await expect(blockService.getData(blockNumber)).rejects.toThrowError(new Error("log service error"));
      });

      it("stops block processing duration metric and sets label to error", async () => {
        expect.assertions(2);
        try {
          await blockService.getData(blockNumber);
        } catch {
          expect(stopBlockDurationMetricMock).toHaveBeenCalledTimes(1);
          expect(stopBlockDurationMetricMock).toHaveBeenCalledWith({
            status: "error",
            action: "get",
          });
        }
      });

      it("clears tracked address changes state", async () => {
        expect.assertions(2);
        try {
          await blockService.getData(blockNumber);
        } catch {
          expect(balanceServiceMock.clearTrackedState).toHaveBeenCalledTimes(1);
          expect(balanceServiceMock.clearTrackedState).toHaveBeenCalledWith(blockNumber);
        }
      });
    });

    describe("when block does not contain transactions", () => {
      let logs: types.Log[];
      beforeEach(() => {
        const blockData = mock<types.Block>({
          ...blockInfoData,
          transactions: [],
        });
        jest.spyOn(blockchainServiceMock, "getBlock").mockReset();
        jest.spyOn(blockchainServiceMock, "getBlock").mockResolvedValueOnce(blockData);
        logs = [{ index: 0 } as types.Log, { index: 1 } as types.Log];
        jest.spyOn(blockchainServiceMock, "getLogs").mockResolvedValueOnce(logs);
      });

      it("reads logs for block from the blockchain", async () => {
        await blockService.getData(blockNumber);
        expect(blockchainServiceMock.getLogs).toHaveBeenCalledTimes(1);
        expect(blockchainServiceMock.getLogs).toHaveBeenCalledWith({
          fromBlock: blockNumber,
          toBlock: blockNumber,
        });
      });

      it("gets and returns block data", async () => {
        const blockData = await blockService.getData(blockNumber);
        expect(logServiceMock.getData).toHaveBeenCalledTimes(1);
        expect(logServiceMock.getData).toHaveBeenCalledWith(logs, blockDetailsData);
        expect(blockData.blockLogs).toEqual(blockLogData.logs);
        expect(blockData.blockTransfers).toEqual(blockLogData.transfers);
      });
    });

    it("starts the balances duration metric", async () => {
      await blockService.getData(blockNumber);
      expect(startBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("returns changed balances", async () => {
      const blockData = await blockService.getData(blockNumber);
      expect(balanceServiceMock.getChangedBalances).toHaveBeenCalledTimes(1);
      expect(balanceServiceMock.getChangedBalances).toHaveBeenCalledWith(blockNumber);
      expect(blockData.changedBalances).toEqual(blockChangedBalances);
    });

    it("returns empty array as changed balances if there are no any", async () => {
      (balanceServiceMock.getChangedBalances as jest.Mock).mockReset();
      (balanceServiceMock.getChangedBalances as jest.Mock).mockResolvedValue(null);
      const blockData = await blockService.getData(blockNumber);
      expect(balanceServiceMock.getChangedBalances).toHaveBeenCalledTimes(1);
      expect(balanceServiceMock.getChangedBalances).toHaveBeenCalledWith(blockNumber);
      expect(blockData.changedBalances).toEqual([]);
    });

    it("stops the balances duration metric", async () => {
      await blockService.getData(blockNumber);
      expect(stopBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("stops the duration metric", async () => {
      await blockService.getData(blockNumber);
      expect(stopBlockDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("sets duration metric label to success", async () => {
      await blockService.getData(blockNumber);
      expect(stopBlockDurationMetricMock).toHaveBeenCalledWith({
        status: "success",
        action: "get",
      });
    });

    it("clears tracked address changes state", async () => {
      await blockService.getData(blockNumber);
      expect(balanceServiceMock.clearTrackedState).toHaveBeenCalledTimes(1);
      expect(balanceServiceMock.clearTrackedState).toHaveBeenCalledWith(blockNumber);
    });

    it("returns empty block logs array", async () => {
      const blockData = await blockService.getData(blockNumber);
      expect(blockData.blockLogs).toEqual([]);
    });

    it("returns empty block transfers array", async () => {
      const blockData = await blockService.getData(blockNumber);
      expect(blockData.blockTransfers).toEqual([]);
    });
  });
});
