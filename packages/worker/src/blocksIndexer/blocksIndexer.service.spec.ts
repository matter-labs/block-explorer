import { mock } from "jest-mock-extended";
import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { BlocksIndexerWorker } from "./blocksIndexer.worker";
import { BlocksIndexerService, BLOCKS_INDEXER_WORKERS_TOKEN } from "./blocksIndexer.service";

describe("BlocksIndexerService", () => {
  let workerOneMock: BlocksIndexerWorker;
  let workerTwoMock: BlocksIndexerWorker;
  let blocksIndexerService: BlocksIndexerService;

  beforeEach(async () => {
    workerOneMock = mock<BlocksIndexerWorker>({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
    });
    workerTwoMock = mock<BlocksIndexerWorker>({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
    });

    const app = await Test.createTestingModule({
      providers: [
        BlocksIndexerService,
        {
          provide: BLOCKS_INDEXER_WORKERS_TOKEN,
          useValue: [workerOneMock, workerTwoMock],
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());
    blocksIndexerService = app.get(BlocksIndexerService);
  });

  describe("start", () => {
    it("starts all workers in parallel", async () => {
      await blocksIndexerService.start();
      expect(workerOneMock.start).toHaveBeenCalledTimes(1);
      expect(workerTwoMock.start).toHaveBeenCalledTimes(1);
    });
  });

  describe("stop", () => {
    it("stops all workers in parallel", async () => {
      await blocksIndexerService.stop();
      expect(workerOneMock.stop).toHaveBeenCalledTimes(1);
      expect(workerTwoMock.stop).toHaveBeenCalledTimes(1);
    });
  });
});
