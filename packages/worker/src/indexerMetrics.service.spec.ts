import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IndexerMetricsService } from "./indexerMetrics.service";
import { BlockchainService } from "./blockchain";
import { BlockRepository, IndexerStateRepository } from "./repositories";

jest.useFakeTimers();

describe("IndexerMetricsService", () => {
  const lastBlockchainBlockNumber = 100;
  const lastReadyBlockNumber = 80;
  const timer = mock<NodeJS.Timer>();

  let indexerMetricsService: IndexerMetricsService;
  let blockchainServiceMock: BlockchainService;
  let blockchainBlocksMetricMock: jest.Mock;
  let blocksToProcessMetricMock: jest.Mock;
  let missingBlocksMetricMock: jest.Mock;
  let configServiceMock: ConfigService;
  let blockRepositoryMock: BlockRepository;
  let indexerStateRepositoryMock: IndexerStateRepository;

  const getService = async () => {
    const app = await Test.createTestingModule({
      providers: [
        IndexerMetricsService,
        { provide: BlockRepository, useValue: blockRepositoryMock },
        { provide: IndexerStateRepository, useValue: indexerStateRepositoryMock },
        { provide: BlockchainService, useValue: blockchainServiceMock },
        {
          provide: "PROM_METRIC_BLOCKCHAIN_BLOCKS",
          useValue: { set: blockchainBlocksMetricMock },
        },
        {
          provide: "PROM_METRIC_BLOCKS_TO_PROCESS",
          useValue: { set: blocksToProcessMetricMock },
        },
        {
          provide: "PROM_METRIC_MISSING_BLOCKS",
          useValue: { set: missingBlocksMetricMock },
        },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    return app.get<IndexerMetricsService>(IndexerMetricsService);
  };

  beforeEach(async () => {
    blockchainBlocksMetricMock = jest.fn();
    blocksToProcessMetricMock = jest.fn();
    missingBlocksMetricMock = jest.fn();

    blockRepositoryMock = mock<BlockRepository>({
      getMissingBlocksCount: jest.fn().mockResolvedValue(50),
    });
    indexerStateRepositoryMock = mock<IndexerStateRepository>({
      getLastReadyBlockNumber: jest.fn().mockResolvedValue(lastReadyBlockNumber),
    });
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => {
        if (key === "blocks.toBlock") return null;
        if (key === "metrics.collectBlocksToProcessMetricInterval") return 10000;
        if (key === "metrics.missingBlocks.disabled") return true;
        if (key === "metrics.missingBlocks.interval") return 20000;
        return null;
      }),
    });
    blockchainServiceMock = mock<BlockchainService>({
      getBlockNumber: jest.fn().mockResolvedValue(lastBlockchainBlockNumber),
      on: jest.fn(),
    });

    jest.spyOn(global, "setInterval").mockImplementation((callback: () => void) => {
      callback();
      return timer as unknown as NodeJS.Timeout;
    });
    jest.spyOn(global, "clearInterval");

    indexerMetricsService = await getService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("onModuleInit", () => {
    it("sets the value for blockchain blocks metric", async () => {
      await indexerMetricsService.onModuleInit();
      expect(blockchainBlocksMetricMock).toBeCalledWith(lastBlockchainBlockNumber);
    });

    it("subscribes to new blocks", async () => {
      await indexerMetricsService.onModuleInit();
      expect(blockchainServiceMock.on).toHaveBeenCalledWith("block", expect.any(Function));
    });

    describe("when new block arrives", () => {
      it("updates blockchain blocks metric with the new block number", async () => {
        await indexerMetricsService.onModuleInit();
        const onBlock = (blockchainServiceMock.on as jest.Mock).mock.calls[0][1];

        onBlock(lastBlockchainBlockNumber + 1);
        expect(blockchainBlocksMetricMock).toHaveBeenCalledWith(lastBlockchainBlockNumber + 1);
      });

      it("keeps the previous value when the new block number is falsy", async () => {
        await indexerMetricsService.onModuleInit();
        const onBlock = (blockchainServiceMock.on as jest.Mock).mock.calls[0][1];

        onBlock(null);
        expect(blockchainBlocksMetricMock).toHaveBeenLastCalledWith(lastBlockchainBlockNumber);
      });
    });

    describe("blocks-to-process metric", () => {
      it("sets the metric to chainTip - lastReadyBlockNumber when toBlock is not set", async () => {
        const updateSpy = jest.spyOn(
          indexerMetricsService as unknown as { setBlocksToProcessMetric: () => Promise<void> },
          "setBlocksToProcessMetric"
        );
        await indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blocksToProcessMetricMock).toHaveBeenCalledWith(lastBlockchainBlockNumber - lastReadyBlockNumber);
      });

      it("caps at toBlock when toBlock is set and lower than chain tip", async () => {
        (configServiceMock.get as jest.Mock).mockImplementation((key: string) => {
          if (key === "blocks.toBlock") return 90;
          if (key === "metrics.collectBlocksToProcessMetricInterval") return 10000;
          if (key === "metrics.missingBlocks.disabled") return true;
          return null;
        });
        indexerMetricsService = await getService();
        const updateSpy = jest.spyOn(
          indexerMetricsService as unknown as { setBlocksToProcessMetric: () => Promise<void> },
          "setBlocksToProcessMetric"
        );

        await indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blocksToProcessMetricMock).toHaveBeenCalledWith(90 - lastReadyBlockNumber);
      });

      it("never goes below zero", async () => {
        (indexerStateRepositoryMock.getLastReadyBlockNumber as jest.Mock).mockResolvedValue(
          lastBlockchainBlockNumber + 10
        );
        const updateSpy = jest.spyOn(
          indexerMetricsService as unknown as { setBlocksToProcessMetric: () => Promise<void> },
          "setBlocksToProcessMetric"
        );

        await indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blocksToProcessMetricMock).toHaveBeenCalledWith(0);
      });

      it("schedules the setInterval with configured value", async () => {
        await indexerMetricsService.onModuleInit();
        expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 10000);
      });
    });

    describe("when missing blocks metric is disabled", () => {
      beforeEach(async () => {
        (configServiceMock.get as jest.Mock).mockImplementation((key: string) => {
          if (key === "metrics.missingBlocks.disabled") return true;
          if (key === "metrics.missingBlocks.interval") return 1000;
          if (key === "metrics.collectBlocksToProcessMetricInterval") return 10000;
          return null;
        });
        indexerMetricsService = await getService();
      });

      it("does not query or set the missing blocks metric", async () => {
        await indexerMetricsService.onModuleInit();
        expect(blockRepositoryMock.getMissingBlocksCount).not.toHaveBeenCalled();
        expect(missingBlocksMetricMock).not.toHaveBeenCalled();
      });
    });

    describe("when missing blocks metric is enabled", () => {
      beforeEach(async () => {
        (configServiceMock.get as jest.Mock).mockImplementation((key: string) => {
          if (key === "metrics.missingBlocks.disabled") return false;
          if (key === "metrics.missingBlocks.interval") return 1000;
          if (key === "metrics.collectBlocksToProcessMetricInterval") return 10000;
          return null;
        });
        indexerMetricsService = await getService();
      });

      it("sets the missing blocks metric using the watermark", async () => {
        const updateSpy = jest.spyOn(
          indexerMetricsService as unknown as { updateMissingBlocksMetric: () => Promise<void> },
          "updateMissingBlocksMetric"
        );
        await indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blockRepositoryMock.getMissingBlocksCount).toHaveBeenCalledWith(lastReadyBlockNumber);
        expect(missingBlocksMetricMock).toBeCalledWith(50);
      });
    });
  });

  describe("onModuleDestroy", () => {
    it("clears the blocks-to-process metric timer", async () => {
      await indexerMetricsService.onModuleInit();
      indexerMetricsService.onModuleDestroy();
      expect(global.clearInterval).toBeCalledWith(timer);
    });

    describe("when missing blocks metric is disabled", () => {
      beforeEach(async () => {
        (configServiceMock.get as jest.Mock).mockImplementation((key: string) => {
          if (key === "metrics.missingBlocks.disabled") return true;
          return null;
        });
        indexerMetricsService = await getService();
      });

      it("only clears the blocks-to-process timer", async () => {
        await indexerMetricsService.onModuleInit();
        indexerMetricsService.onModuleDestroy();
        expect(global.clearInterval).toBeCalledTimes(1);
      });
    });

    describe("when missing blocks metric is enabled", () => {
      beforeEach(async () => {
        (configServiceMock.get as jest.Mock).mockImplementation((key: string) => {
          if (key === "metrics.missingBlocks.disabled") return false;
          return null;
        });
        indexerMetricsService = await getService();
      });

      it("clears both timers", async () => {
        await indexerMetricsService.onModuleInit();
        indexerMetricsService.onModuleDestroy();
        expect(global.clearInterval).toBeCalledTimes(2);
      });
    });
  });
});
