import { mock } from "jest-mock-extended";
import { IsNull, Not } from "typeorm";
import { types } from "zksync-ethers";
import { BatchState } from "../entities/batch.entity";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BatchRepository, BlockRepository } from "../repositories";
import { Block } from "../entities";
import { BatchProcessor } from "./batch.processor";

const mockLoggerError = jest.fn();

jest.mock("@nestjs/common", () => {
  return {
    Logger: function () {
      return { debug: jest.fn(), log: jest.fn(), error: mockLoggerError };
    },
  };
});

describe("BatchProcessor", () => {
  describe("processNextBatch", () => {
    let batchRepositoryMock: BatchRepository;
    let blockRepositoryMock: BlockRepository;
    let blockchainServiceMock: BlockchainService;
    let nextBatchProcessor: BatchProcessor;

    beforeEach(() => {
      batchRepositoryMock = mock<BatchRepository>({
        getLastBatch: jest.fn().mockResolvedValue({ number: 10 }),
        upsert: jest.fn().mockResolvedValue(null),
      });
      blockRepositoryMock = mock<BlockRepository>({
        getLastBlock: jest.fn().mockResolvedValue(null),
      });
      blockchainServiceMock = mock<BlockchainService>();
      nextBatchProcessor = new BatchProcessor(
        BatchState.Executed,
        blockchainServiceMock,
        batchRepositoryMock,
        blockRepositoryMock
      );
    });

    it("fetches the next batch from the blockchain", async () => {
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockResolvedValue(null);

      await nextBatchProcessor.processNextBatch();
      expect(blockchainServiceMock.getL1BatchDetails).toBeCalledWith(11);
    });

    it("returns false when the next batch from the blockchain is null", async () => {
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockResolvedValue(null);

      const result = await nextBatchProcessor.processNextBatch();
      expect(result).toBeFalsy();
    });

    it("returns false when the next batch from the blockchain has a different status to current", async () => {
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockResolvedValue({
        provenAt: new Date(),
      } as types.BatchDetails);

      const result = await nextBatchProcessor.processNextBatch();
      expect(result).toBeFalsy();
    });

    it("returns false and logs error when getL1BatchDetails call fails", async () => {
      const error = new Error("error");
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockRejectedValueOnce(error);

      const result = await nextBatchProcessor.processNextBatch();
      expect(result).toBeFalsy();
      expect(mockLoggerError).toBeCalledWith({
        message: "Error while processing next batch",
        stack: error.stack,
        batchNumber: 11,
      });
    });

    it("logs error when last batch number from DB query fails", async () => {
      const error = new Error("error");
      (batchRepositoryMock.getLastBatch as jest.Mock).mockRejectedValueOnce(error);

      const result = await nextBatchProcessor.processNextBatch();
      expect(result).toBeFalsy();
      expect(mockLoggerError).toBeCalledWith({
        message: "Error while processing next batch",
        stack: error.stack,
        batchNumber: null,
      });
    });

    it("does not insert the batch if there is no block for this batch yet in database and returns false", async () => {
      const nextBatch = {
        executedAt: new Date(),
      } as types.BatchDetails;
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockResolvedValue(nextBatch);

      const result = await nextBatchProcessor.processNextBatch();

      expect(batchRepositoryMock.upsert).not.toBeCalled();
      expect(result).toBeFalsy();
    });

    it("does not insert the batch if the last block for this batch does not exist in blockchain and returns false", async () => {
      const nextBatch = {
        executedAt: new Date(),
      } as types.BatchDetails;
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockResolvedValue(nextBatch);
      jest.spyOn(blockchainServiceMock, "getBlock").mockResolvedValue(null);
      jest.spyOn(blockRepositoryMock, "getLastBlock").mockResolvedValue({
        number: 100,
        hash: "hash1",
      } as Block);

      const result = await nextBatchProcessor.processNextBatch();

      expect(batchRepositoryMock.upsert).not.toBeCalled();
      expect(result).toBeFalsy();
    });

    it("does not insert the batch if the last block for this batch has a different hash to the one in blockchain and returns false", async () => {
      const nextBatch = {
        executedAt: new Date(),
      } as types.BatchDetails;
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockResolvedValue(nextBatch);
      jest.spyOn(blockchainServiceMock, "getBlock").mockResolvedValue({
        hash: "hash2",
      } as types.Block);
      jest.spyOn(blockRepositoryMock, "getLastBlock").mockResolvedValue({
        number: 100,
        hash: "hash1",
      } as Block);

      const result = await nextBatchProcessor.processNextBatch();

      expect(batchRepositoryMock.upsert).not.toBeCalled();
      expect(result).toBeFalsy();
    });

    it("upserts the next batch and returns true when the next batch from the blockchain has the same status as current status", async () => {
      const nextBatch = {
        executedAt: new Date(),
        timestamp: new Date().getTime() / 1000,
      } as types.BatchDetails;
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockResolvedValue(nextBatch);
      jest.spyOn(blockchainServiceMock, "getBlock").mockResolvedValue({
        hash: "hash1",
      } as types.Block);
      jest.spyOn(blockRepositoryMock, "getLastBlock").mockResolvedValue({
        number: 100,
        hash: "hash1",
      } as Block);

      const result = await nextBatchProcessor.processNextBatch();

      expect(batchRepositoryMock.upsert).toBeCalledWith({
        ...nextBatch,
        timestamp: new Date(nextBatch.timestamp * 1000),
      });
      expect(result).toBeTruthy();
    });

    it("calls the next batch the next time the function is called", async () => {
      const nextBatch = {
        executedAt: new Date(),
      } as types.BatchDetails;
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockResolvedValueOnce(nextBatch);
      jest.spyOn(blockchainServiceMock, "getBlock").mockResolvedValueOnce({
        hash: "hash1",
      } as types.Block);
      jest.spyOn(blockRepositoryMock, "getLastBlock").mockResolvedValueOnce({
        number: 100,
        hash: "hash1",
      } as Block);
      jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockResolvedValueOnce(null);

      await nextBatchProcessor.processNextBatch();
      await nextBatchProcessor.processNextBatch();

      expect(blockchainServiceMock.getL1BatchDetails).toBeCalledTimes(2);
      expect(blockchainServiceMock.getL1BatchDetails).toBeCalledWith(12);
      expect(batchRepositoryMock.getLastBatch).toBeCalledTimes(1);
    });
  });

  describe("getLastProcessedBatchNumber", () => {
    describe("when state is executed", () => {
      it("returns -1 when there are no executed batches in the DB", async () => {
        const batchRepository = mock<BatchRepository>({
          getLastBatch: jest.fn().mockResolvedValue(null),
        });
        const batchProcessor = new BatchProcessor(
          BatchState.Executed,
          mock<BlockchainService>(),
          batchRepository,
          mock<BlockRepository>()
        );
        const lastProcessedBatch = await batchProcessor.getLastProcessedBatchNumber();

        expect(batchRepository.getLastBatch).toBeCalledTimes(1);
        expect(batchRepository.getLastBatch).toBeCalledWith(
          {
            executedAt: Not(IsNull()),
          },
          {
            number: true,
          }
        );
        expect(lastProcessedBatch).toBe(-1);
      });

      it("returns the last executed batch number when there are executed batches in the DB", async () => {
        const batchRepository = mock<BatchRepository>({
          getLastBatch: jest.fn().mockResolvedValue({ number: 10 }),
        });
        const batchProcessor = new BatchProcessor(
          BatchState.Executed,
          mock<BlockchainService>(),
          batchRepository,
          mock<BlockRepository>()
        );
        const lastProcessedBatch = await batchProcessor.getLastProcessedBatchNumber();

        expect(batchRepository.getLastBatch).toBeCalledTimes(1);
        expect(batchRepository.getLastBatch).toBeCalledWith(
          {
            executedAt: Not(IsNull()),
          },
          {
            number: true,
          }
        );
        expect(lastProcessedBatch).toBe(10);
      });
    });

    describe("when state is proven", () => {
      it("returns -1 when there are no proven batches in the DB", async () => {
        const batchRepository = mock<BatchRepository>({
          getLastBatch: jest.fn().mockResolvedValue(null),
        });
        const batchProcessor = new BatchProcessor(
          BatchState.Proven,
          mock<BlockchainService>(),
          batchRepository,
          mock<BlockRepository>()
        );
        const lastProcessedBatch = await batchProcessor.getLastProcessedBatchNumber();

        expect(batchRepository.getLastBatch).toBeCalledTimes(1);
        expect(batchRepository.getLastBatch).toBeCalledWith(
          {
            provenAt: Not(IsNull()),
          },
          {
            number: true,
          }
        );
        expect(lastProcessedBatch).toBe(-1);
      });

      it("returns the last proven batch number when there are proven batches in the DB", async () => {
        const batchRepository = mock<BatchRepository>({
          getLastBatch: jest.fn().mockResolvedValue({ number: 10 }),
        });
        const batchProcessor = new BatchProcessor(
          BatchState.Proven,
          mock<BlockchainService>(),
          batchRepository,
          mock<BlockRepository>()
        );
        const lastProcessedBatch = await batchProcessor.getLastProcessedBatchNumber();

        expect(batchRepository.getLastBatch).toBeCalledTimes(1);
        expect(batchRepository.getLastBatch).toBeCalledWith(
          {
            provenAt: Not(IsNull()),
          },
          {
            number: true,
          }
        );
        expect(lastProcessedBatch).toBe(10);
      });
    });

    describe("when state is committed", () => {
      it("returns -1 when there are no committed batches in the DB", async () => {
        const batchRepository = mock<BatchRepository>({
          getLastBatch: jest.fn().mockResolvedValue(null),
        });
        const batchProcessor = new BatchProcessor(
          BatchState.Committed,
          mock<BlockchainService>(),
          batchRepository,
          mock<BlockRepository>()
        );
        const lastProcessedBatch = await batchProcessor.getLastProcessedBatchNumber();

        expect(batchRepository.getLastBatch).toBeCalledTimes(1);
        expect(batchRepository.getLastBatch).toBeCalledWith(
          {
            committedAt: Not(IsNull()),
          },
          {
            number: true,
          }
        );
        expect(lastProcessedBatch).toBe(-1);
      });

      it("returns the last committed batch number when there are committed batches in the DB", async () => {
        const batchRepository = mock<BatchRepository>({
          getLastBatch: jest.fn().mockResolvedValue({ number: 10 }),
        });
        const batchProcessor = new BatchProcessor(
          BatchState.Committed,
          mock<BlockchainService>(),
          batchRepository,
          mock<BlockRepository>()
        );
        const lastProcessedBatch = await batchProcessor.getLastProcessedBatchNumber();

        expect(batchRepository.getLastBatch).toBeCalledTimes(1);
        expect(batchRepository.getLastBatch).toBeCalledWith(
          {
            committedAt: Not(IsNull()),
          },
          {
            number: true,
          }
        );
        expect(lastProcessedBatch).toBe(10);
      });
    });

    describe("when state is new", () => {
      it("returns -1 when there are no batches in the DB", async () => {
        const batchRepository = mock<BatchRepository>({
          getLastBatch: jest.fn().mockResolvedValue(null),
        });
        const batchProcessor = new BatchProcessor(
          BatchState.New,
          mock<BlockchainService>(),
          batchRepository,
          mock<BlockRepository>()
        );
        const lastProcessedBatch = await batchProcessor.getLastProcessedBatchNumber();

        expect(batchRepository.getLastBatch).toBeCalledTimes(1);
        expect(batchRepository.getLastBatch).toBeCalledWith(
          {},
          {
            number: true,
          }
        );
        expect(lastProcessedBatch).toBe(-1);
      });

      it("returns the last batch number when there are batches in the DB", async () => {
        const batchRepository = mock<BatchRepository>({
          getLastBatch: jest.fn().mockResolvedValue({ number: 10 }),
        });
        const batchProcessor = new BatchProcessor(
          BatchState.New,
          mock<BlockchainService>(),
          batchRepository,
          mock<BlockRepository>()
        );
        const lastProcessedBatch = await batchProcessor.getLastProcessedBatchNumber();

        expect(batchRepository.getLastBatch).toBeCalledTimes(1);
        expect(batchRepository.getLastBatch).toBeCalledWith(
          {},
          {
            number: true,
          }
        );
        expect(lastProcessedBatch).toBe(10);
      });
    });
  });

  describe("resetState", () => {
    let batchRepositoryMock: BatchRepository;
    let nextBatchProcessor: BatchProcessor;

    beforeEach(() => {
      batchRepositoryMock = mock<BatchRepository>({
        getLastBatch: jest.fn().mockResolvedValue({ number: 10 }),
      });
      nextBatchProcessor = new BatchProcessor(
        BatchState.Executed,
        mock<BlockchainService>({
          getL1BatchDetails: jest.fn().mockResolvedValue(null),
        }),
        batchRepositoryMock,
        mock<BlockRepository>()
      );
    });

    it("resets last processed batch number cache", async () => {
      await nextBatchProcessor.processNextBatch();
      nextBatchProcessor.resetState();
      await nextBatchProcessor.processNextBatch();

      expect(batchRepositoryMock.getLastBatch).toHaveBeenCalledTimes(2);
    });
  });
});
