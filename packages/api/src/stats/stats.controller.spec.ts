import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Not, IsNull } from "typeorm";
import { BatchService } from "../batch/batch.service";
import { BlockService } from "../block/block.service";
import { TransactionService } from "../transaction/transaction.service";
import { StatsController } from "./stats.controller";

describe("StatsController", () => {
  let batchServiceMock: BatchService;
  let blockServiceMock: BlockService;
  let transactionServiceMock: TransactionService;
  let statsController: StatsController;

  beforeEach(async () => {
    batchServiceMock = mock<BatchService>();
    blockServiceMock = mock<BlockService>();
    transactionServiceMock = mock<TransactionService>();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [
        {
          provide: BatchService,
          useValue: batchServiceMock,
        },
        {
          provide: BlockService,
          useValue: blockServiceMock,
        },
        {
          provide: TransactionService,
          useValue: transactionServiceMock,
        },
      ],
    }).compile();

    statsController = app.get<StatsController>(StatsController);
  });

  describe("stats", () => {
    beforeEach(() => {
      (batchServiceMock.getLastBatchNumber as jest.Mock).mockResolvedValueOnce(6);
      (batchServiceMock.getLastBatchNumber as jest.Mock).mockResolvedValueOnce(8);
      (blockServiceMock.getLastBlockNumber as jest.Mock).mockResolvedValueOnce(10);
      (blockServiceMock.getLastVerifiedBlockNumber as jest.Mock).mockResolvedValueOnce(20);
      (transactionServiceMock.count as jest.Mock).mockResolvedValueOnce(30);
    });

    it("queries sealed and verified batches", async () => {
      await statsController.stats();
      expect(batchServiceMock.getLastBatchNumber).toHaveBeenCalledTimes(2);
      expect(batchServiceMock.getLastBatchNumber).toHaveBeenCalled();
      expect(batchServiceMock.getLastBatchNumber).toHaveBeenCalledWith({ executedAt: Not(IsNull()) });
    });

    it("queries sealed blocks", async () => {
      await statsController.stats();
      expect(blockServiceMock.getLastBlockNumber).toHaveBeenCalledTimes(1);
    });

    it("queries verified blocks", async () => {
      await statsController.stats();
      expect(blockServiceMock.getLastVerifiedBlockNumber).toHaveBeenCalledTimes(1);
    });

    it("returns blockchain stats", async () => {
      const result = await statsController.stats();
      expect(result).toStrictEqual({
        lastSealedBatch: 6,
        lastVerifiedBatch: 8,
        lastSealedBlock: 10,
        lastVerifiedBlock: 20,
        totalTransactions: 30,
      });
    });
  });
});
