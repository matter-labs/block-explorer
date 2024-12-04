import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { MoreThan } from "typeorm";
import { types } from "zksync-ethers";
import { UnitOfWork } from "../unitOfWork";
import { BlockchainService } from "../blockchain";
import { CounterService } from "../counter";
import { Block } from "../entities";
import { BlockRepository, BatchRepository } from "../repositories";
import { BlocksRevertService } from "./index";

describe("BlocksRevertService", () => {
  let blocksRevertService: BlocksRevertService;
  let blockchainServiceMock: BlockchainService;
  let batchRepositoryMock: BatchRepository;
  let blockRepositoryMock: BlockRepository;
  let counterServiceMock: CounterService;
  let unitOfWorkMock: UnitOfWork;
  let waitForTransactionExecutionMock: jest.Mock;
  let revertDurationMetricMock: jest.Mock;
  let stopRevertDurationMetricMock: jest.Mock;

  let revertDetectMetricMock: jest.Mock;
  let stopRevertDetectMetricMock: jest.Mock;

  beforeEach(async () => {
    waitForTransactionExecutionMock = jest.fn();
    unitOfWorkMock = mock<UnitOfWork>({
      useTransaction: jest.fn().mockImplementation((action: () => Promise<void>) => ({
        waitForExecution: waitForTransactionExecutionMock.mockResolvedValue(action()),
        commit: jest.fn().mockResolvedValue(null),
        ensureRollbackIfNotCommitted: jest.fn().mockResolvedValue(null),
      })),
    });
    blockchainServiceMock = mock<BlockchainService>({
      getL1BatchDetails: jest.fn().mockResolvedValue(null),
      getBlock: jest.fn().mockImplementation((number: number) =>
        Promise.resolve({
          number,
          hash: `hash${number}`,
        })
      ),
    });
    batchRepositoryMock = mock<BatchRepository>({
      delete: jest.fn().mockResolvedValue(null),
    });
    blockRepositoryMock = mock<BlockRepository>({
      getLastExecutedBlockNumber: jest.fn().mockResolvedValue(100),
      getLastBlock: jest.fn().mockImplementation(({ where: { number } }: { where: { number: number } }) =>
        Promise.resolve({
          number,
          hash: `hash${number}`,
          l1BatchNumber: Math.floor(number / 3),
        })
      ),
      delete: jest.fn().mockResolvedValue(null),
    });
    counterServiceMock = mock<CounterService>({
      revert: jest.fn().mockResolvedValue(null),
    });

    stopRevertDurationMetricMock = jest.fn();
    revertDurationMetricMock = jest.fn().mockReturnValue(stopRevertDurationMetricMock);

    stopRevertDetectMetricMock = jest.fn();
    revertDetectMetricMock = jest.fn().mockReturnValue(stopRevertDetectMetricMock);

    const app = await Test.createTestingModule({
      providers: [
        BlocksRevertService,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: CounterService,
          useValue: counterServiceMock,
        },
        {
          provide: BatchRepository,
          useValue: batchRepositoryMock,
        },
        {
          provide: BlockRepository,
          useValue: blockRepositoryMock,
        },
        {
          provide: "PROM_METRIC_BLOCKS_REVERT_DURATION_SECONDS",
          useValue: {
            startTimer: revertDurationMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_BLOCKS_REVERT_DETECT",
          useValue: {
            startTimer: revertDetectMetricMock,
          },
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    blocksRevertService = app.get(BlocksRevertService);
  });

  describe("handleRevert", () => {
    describe("when detected incorrect block is the next block after the last executed block in DB", () => {
      it("reverts all the blocks after the last executed block", async () => {
        await blocksRevertService.handleRevert(101);
        expect(blockRepositoryMock.delete).toBeCalledWith({ number: MoreThan(100) });
      });
    });

    describe("when detected incorrect block is not the next block after the last executed block in DB", () => {
      describe("and the last correct block is the last executed block in DB", () => {
        it("reverts all the blocks after the last executed block", async () => {
          jest
            .spyOn(blockRepositoryMock, "getLastBlock")
            .mockImplementation(({ where: { number } }: { where: { number: number } }) => {
              return Promise.resolve({
                number,
                hash: number > 100 ? "different-hash" : `hash${number}`,
                l1BatchNumber: Math.floor(number / 3),
              } as Block);
            });

          await blocksRevertService.handleRevert(105);
          expect(blockRepositoryMock.delete).toBeCalledWith({ number: MoreThan(100) });
        });
      });

      describe("and the last correct block is not the last executed block in DB", () => {
        describe("and the last correct DB block exists in blockchain", () => {
          it("reverts all the blocks after the last correct block", async () => {
            jest
              .spyOn(blockRepositoryMock, "getLastBlock")
              .mockImplementation(({ where: { number } }: { where: { number: number } }) => {
                return Promise.resolve({
                  number,
                  hash: number > 102 ? "different-hash" : `hash${number}`,
                  l1BatchNumber: Math.floor(number / 3),
                } as Block);
              });

            await blocksRevertService.handleRevert(110);
            expect(blockRepositoryMock.delete).toBeCalledWith({ number: MoreThan(102) });
          });
        });

        describe("and the last correct DB block does not exist in blockchain", () => {
          it("reverts all the blocks after the last correct block which exists in blockchain", async () => {
            jest.spyOn(blockchainServiceMock, "getBlock").mockImplementation((number: number) => {
              return Promise.resolve(
                number > 104
                  ? null
                  : ({
                      number,
                      hash: `hash${number}`,
                    } as types.Block)
              );
            });

            await blocksRevertService.handleRevert(110);
            expect(blockRepositoryMock.delete).toBeCalledWith({ number: MoreThan(104) });
          });
        });
      });
    });

    describe("when batch of the last correct block does not exist in DB yet", () => {
      it("reverts all the batches starting from next batch after the batch of the last correct block", async () => {
        await blocksRevertService.handleRevert(101);
        expect(batchRepositoryMock.delete).toBeCalledWith({ number: MoreThan(33) });
      });
    });

    describe("when batch of the last correct block exist in DB", () => {
      beforeEach(() => {
        jest
          .spyOn(blockRepositoryMock, "getLastBlock")
          .mockImplementation(({ where: { number } }: { where: { number: number } }) => {
            const l1BatchNumber = Math.floor(number / 3);
            return Promise.resolve({
              number,
              hash: number > 102 ? "different-hash" : `hash${number}`,
              l1BatchNumber,
              batch: {
                number: l1BatchNumber,
                rootHash: `rootHash${l1BatchNumber}`,
              },
            } as Block);
          });
      });

      describe("and batch of the last correct block does not exist in blockchain", () => {
        it("reverts all the batches starting from the batch of the last correct block", async () => {
          await blocksRevertService.handleRevert(101);
          expect(batchRepositoryMock.delete).toBeCalledWith({ number: MoreThan(32) });
        });
      });

      describe("and batch of the last correct block exists in blockchain", () => {
        describe("and it has the same rootHash as the batch in DB", () => {
          it("reverts all the batches starting from next batch after the batch of the last correct block", async () => {
            jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockImplementation((number: number) => {
              return Promise.resolve({
                number,
                rootHash: `rootHash${number}`,
              } as types.BatchDetails);
            });

            await blocksRevertService.handleRevert(101);
            expect(batchRepositoryMock.delete).toBeCalledWith({ number: MoreThan(33) });
          });
        });

        describe("and it has a different rootHash compared to the batch in DB", () => {
          it("reverts all the batches starting from the batch of the last correct block", async () => {
            jest.spyOn(blockchainServiceMock, "getL1BatchDetails").mockImplementation((number: number) => {
              return Promise.resolve({
                number,
                rootHash: `different-root-hash`,
              } as types.BatchDetails);
            });

            await blocksRevertService.handleRevert(101);
            expect(batchRepositoryMock.delete).toBeCalledWith({ number: MoreThan(32) });
          });
        });
      });
    });

    it("measures time of reverting blocks", async () => {
      await blocksRevertService.handleRevert(101);
      expect(revertDurationMetricMock).toHaveBeenCalledTimes(1);
      expect(stopRevertDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("sets blocks revert detect metric", async () => {
      await blocksRevertService.handleRevert(101);
      expect(revertDetectMetricMock).toHaveBeenCalledTimes(1);
      expect(stopRevertDetectMetricMock).toHaveBeenCalledTimes(1);
    });

    it("reverts counters changes processed after the last correct block", async () => {
      await blocksRevertService.handleRevert(101);
      expect(counterServiceMock.revert).toBeCalledWith(100);
    });

    describe("when blockchain service call fails", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getBlock").mockRejectedValue(new Error("blockchain failure"));
      });

      it("throws the original error", async () => {
        await expect(blocksRevertService.handleRevert(110)).rejects.toThrowError(new Error("blockchain failure"));
      });

      it("measures time of reverting blocks", async () => {
        await blocksRevertService.handleRevert(101);
        expect(revertDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRevertDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });
  });
});
