import { mock } from "jest-mock-extended";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { BatchWorker } from "./batch.worker";
import { BatchProcessor } from "./batch.processor";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BatchRepository, BlockRepository } from "../repositories";
import { BatchState } from "../entities/batch.entity";
import { BatchService } from "./";

jest.mock("./batch.worker");
jest.mock("./batch.processor");

describe("BatchService", () => {
  let batchRepositoryMock: BatchRepository;
  let blockRepositoryMock: BlockRepository;
  let blockChainServiceMock: BlockchainService;
  let batchService: BatchService;
  let batchWorkerMock: BatchWorker;

  beforeEach(async () => {
    batchWorkerMock = mock<BatchWorker>({
      start: jest.fn().mockResolvedValue(null),
      stop: jest.fn(),
    });
    (BatchWorker as jest.Mock).mockReturnValue(batchWorkerMock);

    const configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(10),
    });
    blockChainServiceMock = mock<BlockchainService>();
    batchRepositoryMock = mock<BatchRepository>();
    blockRepositoryMock = mock<BlockRepository>();

    const app = await Test.createTestingModule({
      providers: [
        BatchService,
        {
          provide: BatchRepository,
          useValue: batchRepositoryMock,
        },
        {
          provide: BlockRepository,
          useValue: blockRepositoryMock,
        },
        {
          provide: BlockchainService,
          useValue: blockChainServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    batchService = app.get(BatchService);
  });

  it("initializes a BatchWorker for each batch state", () => {
    batchService.start();

    expect(BatchWorker).toHaveBeenCalledTimes(4);
    expect(BatchWorker).toHaveBeenCalledWith(expect.any(BatchProcessor), 10);
    expect(BatchProcessor).toHaveBeenCalledWith(
      BatchState.Executed,
      blockChainServiceMock,
      batchRepositoryMock,
      blockRepositoryMock
    );
    expect(BatchProcessor).toHaveBeenCalledWith(
      BatchState.Proven,
      blockChainServiceMock,
      batchRepositoryMock,
      blockRepositoryMock
    );
    expect(BatchProcessor).toHaveBeenCalledWith(
      BatchState.Committed,
      blockChainServiceMock,
      batchRepositoryMock,
      blockRepositoryMock
    );
    expect(BatchProcessor).toHaveBeenCalledWith(
      BatchState.New,
      blockChainServiceMock,
      batchRepositoryMock,
      blockRepositoryMock
    );
  });

  describe("start", () => {
    it("starts each batch worker", async () => {
      await batchService.start();
      expect(batchWorkerMock.start).toHaveBeenCalledTimes(4);
    });
  });

  describe("stop", () => {
    it("stops each batch worker", async () => {
      await batchService.stop();
      expect(batchWorkerMock.stop).toHaveBeenCalledTimes(4);
    });
  });
});
