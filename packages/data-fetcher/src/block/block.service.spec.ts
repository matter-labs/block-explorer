import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { TransactionService } from "../transaction";
import { BlockchainService } from "../blockchain";
import { BalanceService } from "../balance";
import { BlockService } from "./";
import { TokenType } from "../token/token.service";

describe("BlockService", () => {
  let blockService: BlockService;
  let blockchainServiceMock: BlockchainService;
  let transactionServiceMock: TransactionService;
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
  ];

  const blockInfoData = {
    hash: "hash",
  };

  const blockTraceData = [
    {
      txHash: "transactionHash1",
      result: {
        type: "mock",
      },
    },
  ];

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
      debugTraceBlock: jest.fn().mockResolvedValue(blockTraceData),
      getLogs: jest.fn().mockResolvedValue([]),
    });
    transactionServiceMock = mock<TransactionService>({
      getData: jest.fn().mockResolvedValueOnce(transactionData[0]).mockResolvedValueOnce(transactionData[1]),
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
      expect(blockData.block).toEqual(blockInfoData);
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
    });

    it("returns null if block does not exist in blockchain", async () => {
      (blockchainServiceMock.getBlock as jest.Mock).mockResolvedValue(null);
      const blockData = await blockService.getData(blockNumber);
      expect(blockData).toBeNull();
    });

    it("returns block transactions data", async () => {
      const blockData = await blockService.getData(blockNumber);
      expect(transactionServiceMock.getData).toHaveBeenCalledTimes(1);
      expect(transactionServiceMock.getData).toHaveBeenCalledWith(
        blockTraceData[0].txHash,
        blockTraceData[0].result,
        blockInfoData
      );
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
  });
});
