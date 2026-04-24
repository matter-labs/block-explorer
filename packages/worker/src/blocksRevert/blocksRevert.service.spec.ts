import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { MoreThan } from "typeorm";
import { Block as EthersBlock } from "ethers";
import { UnitOfWork } from "../unitOfWork";
import { BlockchainService } from "../blockchain";
import { CounterService } from "../counter";
import { Block, BlockStatus } from "../entities";
import { BlockRepository, BlockQueueRepository, IndexerStateRepository } from "../repositories";
import { BlocksRevertService } from "./index";

describe("BlocksRevertService", () => {
  let blocksRevertService: BlocksRevertService;
  let blockchainServiceMock: BlockchainService;
  let blockRepositoryMock: BlockRepository;
  let blockQueueRepositoryMock: BlockQueueRepository;
  let indexerStateRepositoryMock: IndexerStateRepository;
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
      getBlock: jest.fn().mockImplementation((number: number) =>
        Promise.resolve({
          number,
          hash: `hash${number}`,
        })
      ),
    });
    blockRepositoryMock = mock<BlockRepository>({
      getBlock: jest
        .fn()
        .mockImplementation(({ where: { number, status } }: { where: { number?: number; status?: BlockStatus } }) =>
          status === BlockStatus.Executed
            ? Promise.resolve({
                number: 100,
              })
            : Promise.resolve({
                number,
                hash: `hash${number}`,
              })
        ),
      delete: jest.fn().mockResolvedValue(null),
      deleteWithReturningNumber: jest.fn().mockResolvedValue([]),
    });
    blockQueueRepositoryMock = mock<BlockQueueRepository>({
      enqueue: jest.fn().mockResolvedValue(null),
    });
    counterServiceMock = mock<CounterService>({
      revert: jest.fn().mockResolvedValue(null),
    });
    indexerStateRepositoryMock = mock<IndexerStateRepository>({
      setLastReadyBlockNumber: jest.fn().mockResolvedValue(null),
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
          provide: BlockRepository,
          useValue: blockRepositoryMock,
        },
        {
          provide: BlockQueueRepository,
          useValue: blockQueueRepositoryMock,
        },
        {
          provide: IndexerStateRepository,
          useValue: indexerStateRepositoryMock,
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
      it("reverts all the blocks after the last executed block up to the last ready block", async () => {
        await blocksRevertService.handleRevert(101);
        expect(blockRepositoryMock.deleteWithReturningNumber).toBeCalledWith({ number: MoreThan(100) });
      });

      it("updates last ready block number to the last correct block", async () => {
        await blocksRevertService.handleRevert(101);
        expect(indexerStateRepositoryMock.setLastReadyBlockNumber).toBeCalledWith(100);
      });
    });

    describe("when detected incorrect block is not the next block after the last executed block in DB", () => {
      describe("and the last correct block is the last executed block in DB", () => {
        it("reverts all the blocks after the last executed block up to the last ready block", async () => {
          jest
            .spyOn(blockRepositoryMock, "getBlock")
            .mockImplementation(({ where: { number } }: { where: { number: number } }) => {
              return Promise.resolve({
                number,
                hash: number > 100 ? "different-hash" : `hash${number}`,
              } as Block);
            });

          await blocksRevertService.handleRevert(105);
          expect(blockRepositoryMock.deleteWithReturningNumber).toBeCalledWith({ number: MoreThan(100) });
        });
      });

      describe("and the last correct block is not the last executed block in DB", () => {
        describe("and the last correct DB block exists in blockchain", () => {
          it("reverts all the blocks after the last correct block up to the last ready block", async () => {
            jest
              .spyOn(blockRepositoryMock, "getBlock")
              .mockImplementation(({ where: { number } }: { where: { number: number } }) => {
                return Promise.resolve({
                  number,
                  hash: number > 102 ? "different-hash" : `hash${number}`,
                } as Block);
              });

            await blocksRevertService.handleRevert(110);
            expect(blockRepositoryMock.deleteWithReturningNumber).toBeCalledWith({ number: MoreThan(102) });
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
                    } as EthersBlock)
              );
            });

            await blocksRevertService.handleRevert(110);
            expect(blockRepositoryMock.deleteWithReturningNumber).toBeCalledWith({ number: MoreThan(104) });
          });
        });
      });
    });

    describe("when there are no executed blocks in DB", () => {
      it("uses the first block instead for binary search", async () => {
        jest
          .spyOn(blockRepositoryMock, "getBlock")
          .mockImplementation(({ where: { number, status } }: { where: { number?: number; status?: BlockStatus } }) => {
            return status === BlockStatus.Executed
              ? Promise.resolve(null)
              : Promise.resolve({
                  number,
                  hash: `hash${number}`,
                } as Block);
          });

        await blocksRevertService.handleRevert(101);
        expect(blockRepositoryMock.deleteWithReturningNumber).toBeCalledWith({ number: MoreThan(100) });
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

    describe("re-enqueuing deleted blocks", () => {
      it("re-enqueues the block numbers returned from the delete", async () => {
        jest.spyOn(blockRepositoryMock, "deleteWithReturningNumber").mockResolvedValue([101, 102, 103]);
        await blocksRevertService.handleRevert(101);
        expect(blockQueueRepositoryMock.enqueue).toBeCalledWith([101, 102, 103]);
      });

      it("does not enqueue anything when nothing was deleted", async () => {
        jest.spyOn(blockRepositoryMock, "deleteWithReturningNumber").mockResolvedValue([]);
        await blocksRevertService.handleRevert(101);
        expect(blockQueueRepositoryMock.enqueue).not.toBeCalled();
      });
    });

    describe("when blockchain service call fails", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getBlock").mockRejectedValue(new Error("blockchain failure"));
      });

      it("does not throw, swallows the error so workers can restart", async () => {
        await expect(blocksRevertService.handleRevert(110)).resolves.not.toThrow();
      });

      it("measures time of reverting blocks", async () => {
        await blocksRevertService.handleRevert(101);
        expect(revertDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRevertDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });
  });
});
