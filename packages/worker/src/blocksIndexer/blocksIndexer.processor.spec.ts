import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import { UnitOfWork } from "../unitOfWork";
import { BlockData, Balance } from "../dataFetcher/types";
import { DataFetcherService } from "../dataFetcher/dataFetcher.service";
import { TransactionProcessor } from "../transaction";
import { BalanceService } from "../balance";
import { TokenService } from "../token/token.service";
import { BlockRepository, BlockQueueRepository } from "../repositories";
import { BlocksIndexerProcessor } from "./blocksIndexer.processor";

describe("BlocksIndexerProcessor", () => {
  const defaults = {
    fromBlock: 0,
    toBlock: null,
    blocksProcessingBatchSize: 3,
    maxBlocksAheadOfLastReadyBlock: 1000,
  };

  let blockProcessor: BlocksIndexerProcessor;
  let unitOfWorkMock: UnitOfWork;
  let transactionProcessorMock: TransactionProcessor;
  let balanceServiceMock: BalanceService;
  let tokenServiceMock: TokenService;
  let dataFetcherServiceMock: DataFetcherService;
  let blockRepositoryMock: BlockRepository;
  let blockQueueRepositoryMock: BlockQueueRepository;
  let configServiceMock: ConfigService;

  let startBlocksBatchDurationMetricMock: jest.Mock;
  let stopBlocksBatchDurationMetricMock: jest.Mock;
  let startBlockDurationMetricMock: jest.Mock;
  let stopBlockDurationMetricMock: jest.Mock;

  const buildProcessor = async (overrides: Partial<typeof defaults> = {}) => {
    const config = { ...defaults, ...overrides };
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case "blocks.fromBlock":
            return config.fromBlock;
          case "blocks.toBlock":
            return config.toBlock;
          case "blocks.blocksProcessingBatchSize":
            return config.blocksProcessingBatchSize;
          case "blocks.maxBlocksAheadOfLastReadyBlock":
            return config.maxBlocksAheadOfLastReadyBlock;
          default:
            return undefined;
        }
      }),
    });

    const app = await Test.createTestingModule({
      providers: [
        BlocksIndexerProcessor,
        { provide: UnitOfWork, useValue: unitOfWorkMock },
        { provide: TransactionProcessor, useValue: transactionProcessorMock },
        { provide: BalanceService, useValue: balanceServiceMock },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: DataFetcherService, useValue: dataFetcherServiceMock },
        { provide: BlockRepository, useValue: blockRepositoryMock },
        { provide: BlockQueueRepository, useValue: blockQueueRepositoryMock },
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: "PROM_METRIC_BLOCKS_BATCH_PROCESSING_DURATION_SECONDS",
          useValue: { startTimer: startBlocksBatchDurationMetricMock },
        },
        {
          provide: "PROM_METRIC_BLOCK_PROCESSING_DURATION_SECONDS",
          useValue: { startTimer: startBlockDurationMetricMock },
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());
    return app.get<BlocksIndexerProcessor>(BlocksIndexerProcessor);
  };

  const buildBlockData = (number: number, overrides: Partial<BlockData> = {}): BlockData =>
    ({
      block: {
        number,
        hash: `hash${number}`,
        parentHash: `hash${number - 1}`,
        transactions: [],
        timestamp: Math.floor(Date.now() / 1000),
      },
      transactions: [],
      blockLogs: [],
      blockTransfers: [],
      changedBalances: [],
      ...overrides,
    } as unknown as BlockData);

  beforeEach(async () => {
    unitOfWorkMock = mock<UnitOfWork>({
      useTransaction: jest.fn().mockImplementation((action: () => Promise<void>) => {
        const executionPromise = action();
        return {
          waitForExecution: () => executionPromise,
          commit: jest.fn().mockResolvedValue(null),
          ensureRollbackIfNotCommitted: jest.fn().mockResolvedValue(null),
        };
      }),
    });
    transactionProcessorMock = mock<TransactionProcessor>({
      add: jest.fn().mockResolvedValue(null),
    });
    balanceServiceMock = mock<BalanceService>({
      getERC20TokensForChangedBalances: jest.fn().mockReturnValue([]),
      saveChangedBalances: jest.fn().mockResolvedValue(null),
    });
    tokenServiceMock = mock<TokenService>({
      saveERC20Tokens: jest.fn().mockResolvedValue(null),
    });
    dataFetcherServiceMock = mock<DataFetcherService>({
      getBlockData: jest.fn().mockImplementation((blockNumber: number) => Promise.resolve(buildBlockData(blockNumber))),
    });
    blockRepositoryMock = mock<BlockRepository>({
      getBlock: jest.fn().mockResolvedValue(null),
      add: jest.fn().mockResolvedValue(null),
    });
    blockQueueRepositoryMock = mock<BlockQueueRepository>({
      claim: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(null),
    });

    stopBlocksBatchDurationMetricMock = jest.fn();
    startBlocksBatchDurationMetricMock = jest.fn().mockReturnValue(stopBlocksBatchDurationMetricMock);
    stopBlockDurationMetricMock = jest.fn();
    startBlockDurationMetricMock = jest.fn().mockReturnValue(stopBlockDurationMetricMock);

    blockProcessor = await buildProcessor();
  });

  describe("processNextBlocksRange", () => {
    describe("when the queue is empty", () => {
      beforeEach(() => {
        jest.spyOn(blockQueueRepositoryMock, "claim").mockResolvedValue([]);
      });

      it("returns false", async () => {
        const result = await blockProcessor.processNextBlocksRange();
        expect(result).toBe(false);
      });

      it("does not fetch or add any blocks", async () => {
        await blockProcessor.processNextBlocksRange();
        expect(dataFetcherServiceMock.getBlockData).not.toHaveBeenCalled();
        expect(blockRepositoryMock.add).not.toHaveBeenCalled();
      });

      it("does not remove anything from the queue", async () => {
        await blockProcessor.processNextBlocksRange();
        expect(blockQueueRepositoryMock.remove).not.toHaveBeenCalled();
      });

      it("stops the batch metric with success", async () => {
        await blockProcessor.processNextBlocksRange();
        expect(stopBlocksBatchDurationMetricMock).toHaveBeenCalledWith({ status: "success" });
      });
    });

    describe("when blocks are claimed", () => {
      beforeEach(() => {
        jest.spyOn(blockQueueRepositoryMock, "claim").mockResolvedValue([10, 11, 12]);
      });

      describe("and all blocks fetch successfully", () => {
        it("claims blocks using configured batch size", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(blockQueueRepositoryMock.claim).toHaveBeenCalledWith(defaults.blocksProcessingBatchSize);
        });

        it("fetches data for each claimed number", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(dataFetcherServiceMock.getBlockData).toHaveBeenCalledTimes(3);
          expect(dataFetcherServiceMock.getBlockData).toHaveBeenCalledWith(10);
          expect(dataFetcherServiceMock.getBlockData).toHaveBeenCalledWith(11);
          expect(dataFetcherServiceMock.getBlockData).toHaveBeenCalledWith(12);
        });

        it("adds each block to the DB", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(blockRepositoryMock.add).toHaveBeenCalledTimes(3);
        });

        it("removes all processed block numbers from the queue", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(blockQueueRepositoryMock.remove).toHaveBeenCalledTimes(1);
          expect(blockQueueRepositoryMock.remove).toHaveBeenCalledWith(expect.arrayContaining([10, 11, 12]));
        });

        it("returns true", async () => {
          const result = await blockProcessor.processNextBlocksRange();
          expect(result).toBe(true);
        });

        it("stops batch and block metrics with success", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(stopBlocksBatchDurationMetricMock).toHaveBeenCalledWith({ status: "success" });
          expect(stopBlockDurationMetricMock).toHaveBeenCalledWith({ status: "success", action: "add" });
        });

        it("delegates block transactions to the transaction processor", async () => {
          const blockData = buildBlockData(10, {
            transactions: [
              { transaction: { hash: "tx1" } } as unknown as BlockData["transactions"][number],
              { transaction: { hash: "tx2" } } as unknown as BlockData["transactions"][number],
            ],
          });
          jest.spyOn(blockQueueRepositoryMock, "claim").mockResolvedValue([10]);
          jest.spyOn(dataFetcherServiceMock, "getBlockData").mockResolvedValue(blockData);

          await blockProcessor.processNextBlocksRange();
          expect(transactionProcessorMock.add).toHaveBeenCalledTimes(2);
        });

        describe("when a block has changed balances", () => {
          beforeEach(() => {
            const blockData = buildBlockData(10, {
              changedBalances: [
                { address: "a1", tokenAddress: "t1", balance: "b1" } as Balance,
                { address: "a2", tokenAddress: "t2", balance: "b2" } as Balance,
              ],
            });
            jest.spyOn(blockQueueRepositoryMock, "claim").mockResolvedValue([10]);
            jest.spyOn(dataFetcherServiceMock, "getBlockData").mockResolvedValue(blockData);
            (balanceServiceMock.getERC20TokensForChangedBalances as jest.Mock).mockReturnValue(["t1", "t2"]);
          });

          it("saves changed balances", async () => {
            await blockProcessor.processNextBlocksRange();
            expect(balanceServiceMock.saveChangedBalances).toHaveBeenCalledWith([
              { address: "a1", tokenAddress: "t1", balance: "b1" },
              { address: "a2", tokenAddress: "t2", balance: "b2" },
            ]);
          });

          it("saves ERC20 tokens derived from changed balances", async () => {
            await blockProcessor.processNextBlocksRange();
            expect(tokenServiceMock.saveERC20Tokens).toHaveBeenCalledWith(["t1", "t2"]);
          });
        });
      });

      describe("and some fetches return a null block", () => {
        beforeEach(() => {
          jest
            .spyOn(dataFetcherServiceMock, "getBlockData")
            .mockImplementation((n: number) =>
              Promise.resolve(n === 11 ? ({ block: null } as unknown as BlockData) : buildBlockData(n))
            );
        });

        it("adds only the successfully fetched blocks", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(blockRepositoryMock.add).toHaveBeenCalledTimes(2);
        });

        it("removes only the processed block numbers from the queue", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(blockQueueRepositoryMock.remove).toHaveBeenCalledWith(expect.arrayContaining([10, 12]));
          expect(blockQueueRepositoryMock.remove).not.toHaveBeenCalledWith(expect.arrayContaining([11]));
        });

        it("returns true", async () => {
          const result = await blockProcessor.processNextBlocksRange();
          expect(result).toBe(true);
        });
      });

      describe("and some fetches throw", () => {
        beforeEach(() => {
          jest
            .spyOn(dataFetcherServiceMock, "getBlockData")
            .mockImplementation((n: number) =>
              n === 11 ? Promise.reject(new Error("fetch failed")) : Promise.resolve(buildBlockData(n))
            );
        });

        it("adds only the successfully fetched blocks", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(blockRepositoryMock.add).toHaveBeenCalledTimes(2);
        });

        it("removes only the processed block numbers from the queue", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(blockQueueRepositoryMock.remove).toHaveBeenCalledWith(expect.arrayContaining([10, 12]));
        });

        it("returns true", async () => {
          const result = await blockProcessor.processNextBlocksRange();
          expect(result).toBe(true);
        });
      });

      describe("and none of the claimed blocks are available", () => {
        beforeEach(() => {
          jest.spyOn(dataFetcherServiceMock, "getBlockData").mockResolvedValue({ block: null } as unknown as BlockData);
        });

        it("returns false", async () => {
          const result = await blockProcessor.processNextBlocksRange();
          expect(result).toBe(false);
        });

        it("does not call remove on the queue", async () => {
          await blockProcessor.processNextBlocksRange();
          expect(blockQueueRepositoryMock.remove).not.toHaveBeenCalled();
        });
      });

      describe("and addBlock throws for one block", () => {
        beforeEach(() => {
          jest.spyOn(blockRepositoryMock, "add").mockRejectedValue(new Error("db error"));
        });

        it("throws the error from processNextBlocksRange", async () => {
          await expect(blockProcessor.processNextBlocksRange()).rejects.toThrow("db error");
        });

        it("does not call remove on the queue", async () => {
          await expect(blockProcessor.processNextBlocksRange()).rejects.toThrow();
          expect(blockQueueRepositoryMock.remove).not.toHaveBeenCalled();
        });

        it("stops batch metric with error", async () => {
          await expect(blockProcessor.processNextBlocksRange()).rejects.toThrow();
          expect(stopBlocksBatchDurationMetricMock).toHaveBeenCalledWith({ status: "error" });
        });
      });
    });
  });
});
