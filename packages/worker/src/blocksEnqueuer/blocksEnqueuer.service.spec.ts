import { mock } from "jest-mock-extended";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import waitFor from "../utils/waitFor";
import { ChainTipTracker } from "../chainTipTracker.service";
import { BlockRepository, BlockQueueRepository, IndexerStateRepository } from "../repositories";
import { Block } from "../entities";
import { BlocksEnqueuerService } from "./blocksEnqueuer.service";

jest.mock("../utils/waitFor");

describe("BlocksEnqueuerService", () => {
  const pollingInterval = 1000;
  const maxBlocksAheadOfLastReadyBlock = 1000;

  let service: BlocksEnqueuerService;
  let chainTipTrackerMock: ChainTipTracker;
  let blockRepositoryMock: BlockRepository;
  let blockQueueRepositoryMock: BlockQueueRepository;
  let indexerStateRepositoryMock: IndexerStateRepository;
  let configServiceMock: ConfigService;

  const buildService = async ({
    fromBlock = 0,
    toBlock = null,
  }: { fromBlock?: number; toBlock?: number | null } = {}) => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case "blocks.enqueuerPollingInterval":
            return pollingInterval;
          case "blocks.fromBlock":
            return fromBlock;
          case "blocks.toBlock":
            return toBlock;
          case "blocks.maxBlocksAheadOfLastReadyBlock":
            return maxBlocksAheadOfLastReadyBlock;
          default:
            return undefined;
        }
      }),
    });

    const app = await Test.createTestingModule({
      providers: [
        BlocksEnqueuerService,
        { provide: ChainTipTracker, useValue: chainTipTrackerMock },
        { provide: BlockRepository, useValue: blockRepositoryMock },
        { provide: BlockQueueRepository, useValue: blockQueueRepositoryMock },
        { provide: IndexerStateRepository, useValue: indexerStateRepositoryMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    app.useLogger(mock<Logger>());
    service = app.get(BlocksEnqueuerService);
  };

  beforeEach(() => {
    (waitFor as jest.Mock).mockResolvedValue(null);

    chainTipTrackerMock = mock<ChainTipTracker>({
      getLastBlockNumber: jest.fn().mockReturnValue(100),
    });
    blockRepositoryMock = mock<BlockRepository>({
      getBlock: jest.fn().mockResolvedValue({ number: 50 } as Block),
    });
    blockQueueRepositoryMock = mock<BlockQueueRepository>({
      getLastBlockNumber: jest.fn().mockResolvedValue(60),
      enqueueRange: jest.fn().mockResolvedValue(null),
    });
    indexerStateRepositoryMock = mock<IndexerStateRepository>({
      getLastReadyBlockNumber: jest.fn().mockResolvedValue(0),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("start", () => {
    it("enqueues from max(lastDbBlockNumber, lastQueuedBlockNumber) + 1 up to chain tip", async () => {
      await buildService();

      service.start();
      await service.stop();

      expect(blockQueueRepositoryMock.enqueueRange).toBeCalledWith(61, 100);
    });

    it("uses lastDbBlockNumber + 1 when queue is ahead of nothing (empty queue)", async () => {
      jest.spyOn(blockQueueRepositoryMock, "getLastBlockNumber").mockResolvedValue(null);
      await buildService();

      service.start();
      await service.stop();

      expect(blockQueueRepositoryMock.enqueueRange).toBeCalledWith(51, 100);
    });

    it("starts from 0 when neither DB nor queue has any blocks", async () => {
      jest.spyOn(blockRepositoryMock, "getBlock").mockResolvedValue(null);
      jest.spyOn(blockQueueRepositoryMock, "getLastBlockNumber").mockResolvedValue(null);
      await buildService();

      service.start();
      await service.stop();

      expect(blockQueueRepositoryMock.enqueueRange).toBeCalledWith(0, 100);
    });

    it("respects fromBlock as a lower bound when DB and queue are behind it", async () => {
      jest.spyOn(blockRepositoryMock, "getBlock").mockResolvedValue(null);
      jest.spyOn(blockQueueRepositoryMock, "getLastBlockNumber").mockResolvedValue(null);
      await buildService({ fromBlock: 10 });

      service.start();
      await service.stop();

      expect(blockQueueRepositoryMock.enqueueRange).toBeCalledWith(10, 100);
    });

    it("enqueues a batch of maxBlocksAheadOfLastReadyBlock starting from nextToEnqueue", async () => {
      jest.spyOn(blockRepositoryMock, "getBlock").mockResolvedValue({ number: 50 } as Block);
      jest.spyOn(blockQueueRepositoryMock, "getLastBlockNumber").mockResolvedValue(60);
      jest.spyOn(chainTipTrackerMock, "getLastBlockNumber").mockReturnValue(10_000_000);
      await buildService();

      service.start();
      await service.stop();

      // nextToEnqueue = max(50, 60) + 1 = 61, batchEnd = 61 + 1000 - 1 = 1060
      expect(blockQueueRepositoryMock.enqueueRange).toBeCalledWith(61, 61 + maxBlocksAheadOfLastReadyBlock - 1);
    });

    it("skips when queue is already ahead by at least maxBlocksAheadOfLastReadyBlock", async () => {
      jest.spyOn(blockRepositoryMock, "getBlock").mockResolvedValue({ number: 50 } as Block);
      jest.spyOn(blockQueueRepositoryMock, "getLastBlockNumber").mockResolvedValue(50 + maxBlocksAheadOfLastReadyBlock);
      await buildService();

      service.start();
      await service.stop();

      expect(blockQueueRepositoryMock.enqueueRange).not.toBeCalled();
    });

    it("caps the upper bound at toBlock config", async () => {
      jest.spyOn(chainTipTrackerMock, "getLastBlockNumber").mockReturnValue(10_000);
      await buildService({ fromBlock: 10, toBlock: 80 });

      service.start();
      await service.stop();

      expect(blockQueueRepositoryMock.enqueueRange).toBeCalledWith(61, 80);
    });

    it("does not enqueue when computed upper bound is less than lower bound", async () => {
      jest.spyOn(chainTipTrackerMock, "getLastBlockNumber").mockReturnValue(60);
      await buildService();

      service.start();
      await service.stop();

      expect(blockQueueRepositoryMock.enqueueRange).not.toBeCalled();
    });

    it("queries DB block with a between filter when both fromBlock and toBlock are set", async () => {
      await buildService({ fromBlock: 10, toBlock: 90 });

      service.start();
      await service.stop();

      expect(blockRepositoryMock.getBlock).toBeCalledWith({
        where: { number: Between(10, 90) },
        select: { number: true },
      });
    });

    it("queries DB block with MoreThanOrEqual when only fromBlock is set", async () => {
      await buildService({ fromBlock: 10 });

      service.start();
      await service.stop();

      expect(blockRepositoryMock.getBlock).toBeCalledWith({
        where: { number: MoreThanOrEqual(10) },
        select: { number: true },
      });
    });

    it("queries DB block with LessThanOrEqual when only toBlock is set", async () => {
      await buildService({ toBlock: 90 });

      service.start();
      await service.stop();

      expect(blockRepositoryMock.getBlock).toBeCalledWith({
        where: { number: LessThanOrEqual(90) },
        select: { number: true },
      });
    });

    it("waits for the configured polling interval between iterations", async () => {
      await buildService();

      service.start();
      await service.stop();

      const [, maxWaitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(maxWaitTime).toBe(pollingInterval);
    });

    it("keeps iterating when enqueueRange throws", async () => {
      jest
        .spyOn(blockQueueRepositoryMock, "enqueueRange")
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce(null);

      let secondIterationResolve: (value: unknown) => void;
      const secondIterationPromise = new Promise((resolve) => (secondIterationResolve = resolve));
      jest.spyOn(chainTipTrackerMock, "getLastBlockNumber").mockImplementation(() => {
        if ((chainTipTrackerMock.getLastBlockNumber as jest.Mock).mock.calls.length === 2) {
          secondIterationResolve(null);
        }
        return 100;
      });

      await buildService();
      service.start();
      await secondIterationPromise;
      await service.stop();

      expect(blockQueueRepositoryMock.enqueueRange).toBeCalledTimes(2);
    });
  });
});
