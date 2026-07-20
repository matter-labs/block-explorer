import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IndexerMetricsService } from "./indexerMetrics.service";
import { ChainTipTracker } from "./chainTipTracker.service";
import { BlockRepository, IndexerStateRepository } from "./repositories";

jest.useFakeTimers();

describe("IndexerMetricsService", () => {
  const chainTip = 100;
  const lastReadyBlockNumber = 80;
  const timer = mock<NodeJS.Timer>();

  let indexerMetricsService: IndexerMetricsService;
  let chainTipTrackerMock: ChainTipTracker;
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
        { provide: ChainTipTracker, useValue: chainTipTrackerMock },
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
    chainTipTrackerMock = mock<ChainTipTracker>({
      getLastBlockNumber: jest.fn().mockReturnValue(chainTip),
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
    describe("blocks-to-process metric", () => {
      it("sets blockchain blocks metric to the current chain tip", async () => {
        const updateSpy = jest.spyOn(
          indexerMetricsService as unknown as { setBlocksToProcessMetric: () => Promise<void> },
          "setBlocksToProcessMetric"
        );
        indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blockchainBlocksMetricMock).toHaveBeenCalledWith(chainTip);
      });

      it("sets the metric to chainTip - lastReadyBlockNumber when toBlock is not set", async () => {
        const updateSpy = jest.spyOn(
          indexerMetricsService as unknown as { setBlocksToProcessMetric: () => Promise<void> },
          "setBlocksToProcessMetric"
        );
        indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blocksToProcessMetricMock).toHaveBeenCalledWith(chainTip - lastReadyBlockNumber);
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

        indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blocksToProcessMetricMock).toHaveBeenCalledWith(90 - lastReadyBlockNumber);
      });

      it("never goes below zero", async () => {
        (indexerStateRepositoryMock.getLastReadyBlockNumber as jest.Mock).mockResolvedValue(chainTip + 10);
        const updateSpy = jest.spyOn(
          indexerMetricsService as unknown as { setBlocksToProcessMetric: () => Promise<void> },
          "setBlocksToProcessMetric"
        );

        indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blocksToProcessMetricMock).toHaveBeenCalledWith(0);
      });

      it("does nothing when chain tip is not yet known", async () => {
        (chainTipTrackerMock.getLastBlockNumber as jest.Mock).mockReturnValue(null);
        const updateSpy = jest.spyOn(
          indexerMetricsService as unknown as { setBlocksToProcessMetric: () => Promise<void> },
          "setBlocksToProcessMetric"
        );

        indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blockchainBlocksMetricMock).not.toHaveBeenCalled();
        expect(blocksToProcessMetricMock).not.toHaveBeenCalled();
      });

      it("schedules the setInterval with configured value", async () => {
        indexerMetricsService.onModuleInit();
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
        indexerMetricsService.onModuleInit();
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
        indexerMetricsService.onModuleInit();
        await updateSpy.mock.results[0].value;

        expect(blockRepositoryMock.getMissingBlocksCount).toHaveBeenCalledWith(lastReadyBlockNumber);
        expect(missingBlocksMetricMock).toBeCalledWith(50);
      });
    });
  });

  describe("onModuleDestroy", () => {
    it("clears the blocks-to-process metric timer", () => {
      indexerMetricsService.onModuleInit();
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

      it("only clears the blocks-to-process timer", () => {
        indexerMetricsService.onModuleInit();
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

      it("clears both timers", () => {
        indexerMetricsService.onModuleInit();
        indexerMetricsService.onModuleDestroy();
        expect(global.clearInterval).toBeCalledTimes(2);
      });
    });
  });
});
