import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataFetcherService } from "../dataFetcher/dataFetcher.service";
import { BlockWatcher } from "./block.watcher";
import { BlockchainService } from "../blockchain";

jest.useFakeTimers();

describe("BlockWatcher", () => {
  const lastBlockchainBlockNumber = 100;
  const batchSize = 5;
  const timer = mock<NodeJS.Timer>();

  let blockWatcher: BlockWatcher;
  let blockchainServiceMock: BlockchainService;
  let dataFetcherServiceMock: DataFetcherService;
  let blockchainBlocksMetricMock: jest.Mock;
  let blocksToProcessMetricMock: jest.Mock;
  let getBlockInfoDurationMetricStartMock: jest.Mock;
  let getBlockInfoDurationMetricStopMock: jest.Mock;
  let configServiceMock: ConfigService;

  const getBlockWatcher = async () => {
    const app = await Test.createTestingModule({
      providers: [
        BlockWatcher,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: DataFetcherService,
          useValue: dataFetcherServiceMock,
        },
        {
          provide: "PROM_METRIC_BLOCKCHAIN_BLOCKS",
          useValue: {
            set: blockchainBlocksMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_BLOCKS_TO_PROCESS",
          useValue: {
            set: blocksToProcessMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_GET_BLOCK_INFO_DURATION_SECONDS",
          useValue: {
            startTimer: getBlockInfoDurationMetricStartMock,
          },
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    return app.get<BlockWatcher>(BlockWatcher);
  };

  beforeEach(async () => {
    blockchainBlocksMetricMock = jest.fn();
    blocksToProcessMetricMock = jest.fn();
    getBlockInfoDurationMetricStopMock = jest.fn();
    getBlockInfoDurationMetricStartMock = jest.fn().mockReturnValue(getBlockInfoDurationMetricStopMock);
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => {
        if (key === "blocks.blocksProcessingBatchSize") {
          return batchSize;
        } else if (key === "blocks.fromBlock") {
          return 0;
        } else if (key === "metrics.collectBlocksToProcessMetricInterval") {
          return 10000;
        }
        return null;
      }),
    });
    blockchainServiceMock = mock<BlockchainService>({
      getBlockNumber: jest.fn().mockResolvedValue(lastBlockchainBlockNumber),
      on: jest.fn(),
    });

    dataFetcherServiceMock = mock<DataFetcherService>({
      getBlockData: jest
        .fn()
        .mockImplementation((number: number) => Promise.resolve({ block: { number }, blockDetails: { number } })),
    });

    jest.spyOn(global, "setInterval").mockImplementation((callback: () => void) => {
      callback();
      return timer as unknown as NodeJS.Timeout;
    });
    jest.spyOn(global, "clearInterval");

    blockWatcher = await getBlockWatcher();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNextBlocksToProcess", () => {
    describe("when lastBlockchainBlockNumber is null", () => {
      it("returns empty array", async () => {
        const result = await blockWatcher.getNextBlocksToProcess(lastBlockchainBlockNumber);
        expect(result).toEqual([]);
      });
    });

    describe("when there are blocks in DB", () => {
      beforeEach(async () => {
        await blockWatcher.onModuleInit();
      });

      it("returns an empty array when there are no more blocks to process yet", async () => {
        const blocksToProcess = await blockWatcher.getNextBlocksToProcess(lastBlockchainBlockNumber);
        expect(blocksToProcess).toEqual([]);
      });

      describe("when there are blocks to process", () => {
        describe("and there are less blocks to process in blockchain than the configured batch size", () => {
          it("returns a blocks range up to the last block in the blockchain", async () => {
            const blocksToProcess = await blockWatcher.getNextBlocksToProcess(lastBlockchainBlockNumber - 3);

            expect(blocksToProcess).toEqual([
              {
                block: { number: 98 },
                blockDetails: { number: 98 },
              },
              {
                block: { number: 99 },
                blockDetails: { number: 99 },
              },
              {
                block: { number: 100 },
                blockDetails: { number: 100 },
              },
            ]);
          });
        });

        describe("and there are more blocks to process in blockchain than the configured batch size", () => {
          it("returns a blocks range of batch size length", async () => {
            const blocksToProcess = await blockWatcher.getNextBlocksToProcess(lastBlockchainBlockNumber - 6);

            expect(blocksToProcess).toEqual([
              {
                block: { number: 95 },
                blockDetails: { number: 95 },
              },
              {
                block: { number: 96 },
                blockDetails: { number: 96 },
              },
              {
                block: { number: 97 },
                blockDetails: { number: 97 },
              },
              {
                block: { number: 98 },
                blockDetails: { number: 98 },
              },
              {
                block: { number: 99 },
                blockDetails: { number: 99 },
              },
            ]);
          });
        });

        it("measures time of calling blockchain for each block", async () => {
          await blockWatcher.getNextBlocksToProcess(lastBlockchainBlockNumber - 3);

          expect(getBlockInfoDurationMetricStartMock).toHaveBeenCalledTimes(3);
          expect(getBlockInfoDurationMetricStopMock).toHaveBeenCalledTimes(3);
        });
      });
    });

    describe("when there are no blocks in DB", () => {
      describe("when there are less blocks to process in blockchain than the configured batch size", () => {
        it("returns a blocks range up to the last block in the blockchain", async () => {
          (blockchainServiceMock.getBlockNumber as jest.Mock).mockResolvedValue(2);
          await blockWatcher.onModuleInit();

          const blocksToProcess = await blockWatcher.getNextBlocksToProcess();
          expect(blocksToProcess).toEqual([
            {
              block: { number: 0 },
              blockDetails: { number: 0 },
            },
            {
              block: { number: 1 },
              blockDetails: { number: 1 },
            },
            {
              block: { number: 2 },
              blockDetails: { number: 2 },
            },
          ]);
        });
      });

      describe("when there are more blocks to process in blockchain than the configured batch size", () => {
        it("returns a blocks range of batch size length", async () => {
          (blockchainServiceMock.getBlockNumber as jest.Mock).mockResolvedValue(5);
          await blockWatcher.onModuleInit();

          const blocksToProcess = await blockWatcher.getNextBlocksToProcess();
          expect(blocksToProcess).toEqual([
            {
              block: { number: 0 },
              blockDetails: { number: 0 },
            },
            {
              block: { number: 1 },
              blockDetails: { number: 1 },
            },
            {
              block: { number: 2 },
              blockDetails: { number: 2 },
            },
            {
              block: { number: 3 },
              blockDetails: { number: 3 },
            },
            {
              block: { number: 4 },
              blockDetails: { number: 4 },
            },
          ]);
        });
      });

      it("measures time of calling blockchain for each block", async () => {
        (blockchainServiceMock.getBlockNumber as jest.Mock).mockResolvedValue(2);
        await blockWatcher.onModuleInit();

        await blockWatcher.getNextBlocksToProcess();

        expect(getBlockInfoDurationMetricStartMock).toHaveBeenCalledTimes(3);
        expect(getBlockInfoDurationMetricStopMock).toHaveBeenCalledTimes(3);
      });
    });

    describe("when fromBlock is specified", () => {
      describe("and fromBlock is greater than last DB block number", () => {
        beforeEach(async () => {
          (configServiceMock.get as jest.Mock)
            .mockReturnValueOnce(batchSize)
            .mockReturnValueOnce(50)
            .mockReturnValueOnce(null);

          blockWatcher = await getBlockWatcher();
          await blockWatcher.onModuleInit();
        });

        it("returns empty array", async () => {
          const result = await blockWatcher.getNextBlocksToProcess(10);
          expect(result).toEqual([]);
        });
      });

      describe("and fromBlock is lesser than last DB block number", () => {
        beforeEach(async () => {
          (configServiceMock.get as jest.Mock)
            .mockReturnValueOnce(batchSize)
            .mockReturnValueOnce(50)
            .mockReturnValueOnce(null);

          blockWatcher = await getBlockWatcher();
          await blockWatcher.onModuleInit();
        });

        it("returns next blocks to process", async () => {
          const result = await blockWatcher.getNextBlocksToProcess(70);
          expect(result).toEqual(
            [71, 72, 73, 74, 75].map((blockNumber) => ({
              block: { number: blockNumber },
              blockDetails: { number: blockNumber },
            }))
          );
        });
      });

      describe("and fromBlock is greater than last available block in blockchain", () => {
        beforeEach(async () => {
          (configServiceMock.get as jest.Mock)
            .mockReturnValueOnce(batchSize)
            .mockReturnValueOnce(200)
            .mockReturnValueOnce(null);

          blockWatcher = await getBlockWatcher();
          await blockWatcher.onModuleInit();
        });

        it("returns empty array", async () => {
          const result = await blockWatcher.getNextBlocksToProcess(110);
          expect(result).toEqual([]);
        });
      });

      describe("and there is no block in the DB with number greater or equal to fromBlock", () => {
        beforeEach(async () => {
          (configServiceMock.get as jest.Mock)
            .mockReturnValueOnce(batchSize)
            .mockReturnValueOnce(50)
            .mockReturnValueOnce(null);

          blockWatcher = await getBlockWatcher();
          await blockWatcher.onModuleInit();
        });

        it("returns next blocks to process starting form the fromBlock", async () => {
          const result = await blockWatcher.getNextBlocksToProcess();
          expect(result).toEqual(
            [50, 51, 52, 53, 54].map((blockNumber) => ({
              block: { number: blockNumber },
              blockDetails: { number: blockNumber },
            }))
          );
        });
      });
    });

    describe("when toBlock is specified", () => {
      describe("and toBlock is lesser than last DB block number", () => {
        beforeEach(async () => {
          (configServiceMock.get as jest.Mock)
            .mockReturnValueOnce(batchSize)
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(50);

          blockWatcher = await getBlockWatcher();
          await blockWatcher.onModuleInit();
        });

        it("returns empty array", async () => {
          const result = await blockWatcher.getNextBlocksToProcess(100);
          expect(result).toEqual([]);
        });
      });

      describe("and toBlock is greater than last DB block number", () => {
        describe("and toBlock is greater than last available block in blockchain", () => {
          beforeEach(async () => {
            (configServiceMock.get as jest.Mock)
              .mockReturnValueOnce(batchSize)
              .mockReturnValueOnce(0)
              .mockReturnValueOnce(200);

            blockWatcher = await getBlockWatcher();
            await blockWatcher.onModuleInit();
          });

          it("returns next blocks to process", async () => {
            const result = await blockWatcher.getNextBlocksToProcess(70);
            expect(result).toEqual(
              [71, 72, 73, 74, 75].map((blockNumber) => ({
                block: { number: blockNumber },
                blockDetails: { number: blockNumber },
              }))
            );
          });
        });

        describe("and toBlock is lesser than last available block in blockchain", () => {
          beforeEach(async () => {
            (configServiceMock.get as jest.Mock)
              .mockReturnValueOnce(batchSize)
              .mockReturnValueOnce(0)
              .mockReturnValueOnce(90);

            blockWatcher = await getBlockWatcher();
            await blockWatcher.onModuleInit();
          });

          it("returns next blocks to process", async () => {
            const result = await blockWatcher.getNextBlocksToProcess(70);
            expect(result).toEqual(
              [71, 72, 73, 74, 75].map((blockNumber) => ({
                block: { number: blockNumber },
                blockDetails: { number: blockNumber },
              }))
            );
          });
        });
      });
    });
  });

  describe("onModuleInit", () => {
    it("sets the value for blockchain blocks metric", async () => {
      await blockWatcher.onModuleInit();
      expect(blockchainBlocksMetricMock).toBeCalledTimes(1);
      expect(blockchainBlocksMetricMock).toBeCalledWith(lastBlockchainBlockNumber);
    });

    it("subscribes to new blocks", async () => {
      await blockWatcher.onModuleInit();
      expect(blockchainServiceMock.on).toHaveBeenCalledTimes(1);
      expect(blockchainServiceMock.on).toHaveBeenCalledWith("block", expect.any(Function));
    });

    describe("when new block arrives", () => {
      it("updates last blockchain block number when the new block number is greater than current", async () => {
        await blockWatcher.onModuleInit();
        const onBlock = (blockchainServiceMock.on as jest.Mock).mock.calls[0][1];

        onBlock(lastBlockchainBlockNumber + 1);
        expect(blockchainBlocksMetricMock).toHaveBeenCalledWith(lastBlockchainBlockNumber + 1);
      });

      it("does not update last blockchain block number when the new block number is not greater than current", async () => {
        await blockWatcher.onModuleInit();
        const onBlock = (blockchainServiceMock.on as jest.Mock).mock.calls[0][1];

        onBlock(lastBlockchainBlockNumber - 1);
        expect(blockchainBlocksMetricMock).toHaveBeenCalledWith(lastBlockchainBlockNumber);
      });

      it("sends blocks to process metric by interval", async () => {
        await blockWatcher.onModuleInit();
        await blockWatcher.getNextBlocksToProcess(50);
        const setMetricFunction = (global.setInterval as unknown as jest.Mock).mock.calls[0][0];
        setMetricFunction();

        expect(global.setInterval).toBeCalledWith(expect.any(Function), 10000);
        expect(blocksToProcessMetricMock).toBeCalledTimes(2);
        expect(blocksToProcessMetricMock).toHaveBeenNthCalledWith(1, 0);
        expect(blocksToProcessMetricMock).toHaveBeenNthCalledWith(2, 50);
      });
    });

    describe("if there is no next block to process", () => {
      it("sends zero blocks to process metric by interval", async () => {
        await blockWatcher.onModuleInit();
        expect(global.setInterval).toBeCalledWith(expect.any(Function), 10000);
        expect(blocksToProcessMetricMock).toBeCalledTimes(1);
        expect(blocksToProcessMetricMock).toBeCalledWith(0);
      });
    });
  });

  describe("onModuleDestroy", () => {
    it("clears interval for metrics timer", async () => {
      await blockWatcher.onModuleInit();
      blockWatcher.onModuleDestroy();
      expect(global.clearInterval).toBeCalledWith(timer);
    });
  });
});
