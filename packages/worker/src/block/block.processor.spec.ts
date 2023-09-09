import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { types } from "zksync-web3";
import { mock } from "jest-mock-extended";
import { MoreThanOrEqual, LessThanOrEqual, Between } from "typeorm";
import { UnitOfWork } from "../unitOfWork";
import { BlockInfo, BlockWatcher } from "./block.watcher";
import { TransactionProcessor } from "../transaction";
import { LogProcessor } from "../log";
import { BlockchainService } from "../blockchain";
import { BalanceService } from "../balance";
import { Block } from "../entities";
import { BlockRepository } from "../repositories";
import { BLOCKS_REVERT_DETECTED_EVENT } from "../constants";
import { BlockProcessor } from "./block.processor";

describe("BlockProcessor", () => {
  let blockProcessor: BlockProcessor;
  let blockWatcherMock: BlockWatcher;
  let unitOfWorkMock: UnitOfWork;
  let blockchainServiceMock: BlockchainService;
  let transactionProcessorMock: TransactionProcessor;
  let logProcessorMock: LogProcessor;
  let balanceServiceMock: BalanceService;
  let blockRepositoryMock: BlockRepository;
  let eventEmitterMock: EventEmitter2;
  let configServiceMock: ConfigService;

  let startBlocksBatchDurationMetricMock: jest.Mock;
  let stopBlocksBatchDurationMetricMock: jest.Mock;

  let startBlockDurationMetricMock: jest.Mock;
  let stopBlockDurationMetricMock: jest.Mock;

  let startBalancesDurationMetricMock: jest.Mock;
  let stopBalancesDurationMetricMock: jest.Mock;

  const getBlockProcessor = async () => {
    const app = await Test.createTestingModule({
      providers: [
        BlockProcessor,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
        {
          provide: BlockWatcher,
          useValue: blockWatcherMock,
        },
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: TransactionProcessor,
          useValue: transactionProcessorMock,
        },
        {
          provide: LogProcessor,
          useValue: logProcessorMock,
        },
        {
          provide: BalanceService,
          useValue: balanceServiceMock,
        },
        {
          provide: BlockRepository,
          useValue: blockRepositoryMock,
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitterMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: "PROM_METRIC_BLOCKS_BATCH_PROCESSING_DURATION_SECONDS",
          useValue: {
            startTimer: startBlocksBatchDurationMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_BLOCK_PROCESSING_DURATION_SECONDS",
          useValue: {
            startTimer: startBlockDurationMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_BALANCES_PROCESSING_DURATION_SECONDS",
          useValue: {
            startTimer: startBalancesDurationMetricMock,
          },
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    return app.get<BlockProcessor>(BlockProcessor);
  };

  beforeEach(async () => {
    unitOfWorkMock = mock<UnitOfWork>({
      useTransaction: jest.fn().mockImplementation((action: () => Promise<void>) => action()),
    });
    blockWatcherMock = mock<BlockWatcher>({
      getNextBlocksToProcess: jest.fn().mockResolvedValue([]),
    });
    blockchainServiceMock = mock<BlockchainService>({
      getBlock: jest.fn().mockResolvedValue({
        hash: "hash",
      }),
      getLogs: jest.fn().mockResolvedValue([]),
    });
    transactionProcessorMock = mock<TransactionProcessor>({
      add: jest.fn().mockResolvedValue(null),
    });
    logProcessorMock = mock<LogProcessor>({
      process: jest.fn().mockResolvedValue(null),
    });
    balanceServiceMock = mock<BalanceService>({
      saveChangedBalances: jest.fn().mockResolvedValue(null),
      clearTrackedState: jest.fn(),
    });
    blockRepositoryMock = mock<BlockRepository>({
      getLastBlock: jest.fn().mockResolvedValue(null),
      add: jest.fn().mockResolvedValue(null),
    });
    eventEmitterMock = mock<EventEmitter2>({
      emit: jest.fn(),
    });
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(null),
    });

    stopBlocksBatchDurationMetricMock = jest.fn();
    startBlocksBatchDurationMetricMock = jest.fn().mockReturnValue(stopBlocksBatchDurationMetricMock);

    stopBlockDurationMetricMock = jest.fn();
    startBlockDurationMetricMock = jest.fn().mockReturnValue(stopBlockDurationMetricMock);

    stopBalancesDurationMetricMock = jest.fn();
    startBalancesDurationMetricMock = jest.fn().mockReturnValue(stopBalancesDurationMetricMock);

    blockProcessor = await getBlockProcessor();
  });

  describe("processNextBlockRange", () => {
    it("fetches the last block from the DB", async () => {
      await blockProcessor.processNextBlocksRange();
      expect(blockRepositoryMock.getLastBlock).toHaveBeenCalledWith({
        where: {},
        select: { number: true, hash: true },
      });
    });

    describe("when fromBlock and toBlock are specified", () => {
      it("fetches the last block from the DB with number greater or equal to fromBlock and less or equal to toBlock", async () => {
        (configServiceMock.get as jest.Mock)
          .mockReturnValueOnce(100)
          .mockReturnValueOnce(1000)
          .mockReturnValueOnce(false);

        blockProcessor = await getBlockProcessor();
        await blockProcessor.processNextBlocksRange();
        expect(blockRepositoryMock.getLastBlock).toHaveBeenCalledWith({
          where: {
            number: Between(100, 1000),
          },
          select: { number: true, hash: true },
        });
      });
    });

    describe("when only fromBlock is specified", () => {
      it("fetches the last block from the DB with number greater or equal to fromBlock", async () => {
        (configServiceMock.get as jest.Mock)
          .mockReturnValueOnce(100)
          .mockReturnValueOnce(null)
          .mockReturnValueOnce(false);

        const blockProcessor = await getBlockProcessor();
        await blockProcessor.processNextBlocksRange();
        expect(blockRepositoryMock.getLastBlock).toHaveBeenCalledWith({
          where: {
            number: MoreThanOrEqual(100),
          },
          select: { number: true, hash: true },
        });
      });
    });

    describe("when only toBlock is specified", () => {
      it("fetches the last block from the DB with number less or equal to toBlock", async () => {
        (configServiceMock.get as jest.Mock)
          .mockReturnValueOnce(null)
          .mockReturnValueOnce(1000)
          .mockReturnValueOnce(false);

        const blockProcessor = await getBlockProcessor();
        await blockProcessor.processNextBlocksRange();
        expect(blockRepositoryMock.getLastBlock).toHaveBeenCalledWith({
          where: {
            number: LessThanOrEqual(1000),
          },
          select: { number: true, hash: true },
        });
      });
    });

    it("fetches the next blocks to process from blockchain when there are no blocks in DB", async () => {
      const lastDbBlockNumber = undefined;
      await blockProcessor.processNextBlocksRange();
      expect(blockWatcherMock.getNextBlocksToProcess).toHaveBeenCalledWith(lastDbBlockNumber);
    });

    it("fetches the next blocks to process from blockchain after the last block from DB when it exist", async () => {
      const lastDbBlock = mock<Block>({
        number: 100,
        hash: "hash",
      });
      jest.spyOn(blockRepositoryMock, "getLastBlock").mockResolvedValue(lastDbBlock);

      await blockProcessor.processNextBlocksRange();
      expect(blockWatcherMock.getNextBlocksToProcess).toHaveBeenCalledWith(lastDbBlock.number);
    });

    describe("when there are no next blocks to process", () => {
      describe("and there are no blocks in DB", () => {
        it("returns false", async () => {
          const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
          expect(isNextBlockRangeProcessed).toBeFalsy();
        });
      });

      describe("and there are blocks in DB", () => {
        describe("and hash of the last block from DB does not match to the same block hash in blockchain", () => {
          beforeEach(() => {
            const lastDbBlock = mock<Block>({
              number: 100,
              hash: "another-hash",
            });
            jest.spyOn(blockRepositoryMock, "getLastBlock").mockResolvedValue(lastDbBlock);
          });

          it("triggers blocks revert event and returns false", async () => {
            const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
            expect(eventEmitterMock.emit).toBeCalledWith(BLOCKS_REVERT_DETECTED_EVENT, {
              detectedIncorrectBlockNumber: 100,
            });
            expect(isNextBlockRangeProcessed).toBeFalsy();
          });

          describe("when blocks revert is disabled", () => {
            it("does not trigger the revert event", async () => {
              (configServiceMock.get as jest.Mock)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(true);
              blockProcessor = await getBlockProcessor();
              const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
              expect(eventEmitterMock.emit).not.toBeCalled();
              expect(isNextBlockRangeProcessed).toBeFalsy();
            });
          });
        });

        describe("and hash of the last block from DB matches to the same block hash in blockchain", () => {
          it("does not trigger blocks revert event and returns false", async () => {
            const lastDbBlock = mock<Block>({
              number: 100,
              hash: "hash",
            });
            jest.spyOn(blockRepositoryMock, "getLastBlock").mockResolvedValue(lastDbBlock);

            const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
            expect(eventEmitterMock.emit).not.toBeCalled();
            expect(isNextBlockRangeProcessed).toBeFalsy();
          });
        });

        describe("and there is no block in blockchain with the same number as the last DB block any more", () => {
          beforeEach(() => {
            const lastDbBlock = mock<Block>({
              number: 100,
              hash: "hash",
            });
            jest.spyOn(blockRepositoryMock, "getLastBlock").mockResolvedValue(lastDbBlock);
            jest.spyOn(blockchainServiceMock, "getBlock").mockResolvedValue(null);
          });

          it("triggers blocks revert event and returns false", async () => {
            const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
            expect(eventEmitterMock.emit).toBeCalledWith(BLOCKS_REVERT_DETECTED_EVENT, {
              detectedIncorrectBlockNumber: 100,
            });
            expect(isNextBlockRangeProcessed).toBeFalsy();
          });

          describe("when blocks revert is disabled", () => {
            it("does not trigger the revert event", async () => {
              (configServiceMock.get as jest.Mock)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(true);
              blockProcessor = await getBlockProcessor();
              const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
              expect(eventEmitterMock.emit).not.toBeCalled();
              expect(isNextBlockRangeProcessed).toBeFalsy();
            });
          });
        });
      });
    });

    describe("when there are next blocks to process", () => {
      describe("and there are no blocks in DB", () => {
        it("does not trigger blocks revert event", async () => {
          jest.spyOn(blockWatcherMock, "getNextBlocksToProcess").mockResolvedValue([
            {
              block: { number: 101, parentHash: "another-hash" },
              blockDetails: null,
            } as BlockInfo,
          ]);

          await blockProcessor.processNextBlocksRange();
          expect(eventEmitterMock.emit).not.toBeCalled();
        });
      });

      describe("and there are blocks in DB", () => {
        beforeEach(() => {
          jest.spyOn(blockRepositoryMock, "getLastBlock").mockResolvedValue({
            number: 100,
            hash: "hash",
          } as Block);
        });

        describe("and parent hash of the first block to process is different to hash of the last block in DB", () => {
          beforeEach(() => {
            jest.spyOn(blockWatcherMock, "getNextBlocksToProcess").mockResolvedValue([
              {
                block: { number: 101, parentHash: "another-hash" },
                blockDetails: {},
              } as BlockInfo,
            ]);
          });

          it("triggers blocks revert event and returns false", async () => {
            const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
            expect(eventEmitterMock.emit).toBeCalledWith(BLOCKS_REVERT_DETECTED_EVENT, {
              detectedIncorrectBlockNumber: 100,
            });
            expect(isNextBlockRangeProcessed).toBeFalsy();
          });

          describe("when blocks revert is disabled", () => {
            it("does not trigger the revert event", async () => {
              (configServiceMock.get as jest.Mock)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(true);
              blockProcessor = await getBlockProcessor();
              const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
              expect(eventEmitterMock.emit).not.toBeCalled();
              expect(isNextBlockRangeProcessed).toBeFalsy();
            });
          });
        });

        describe("and the first block requested to process does not exist in blockchain", () => {
          beforeEach(() => {
            jest.spyOn(blockWatcherMock, "getNextBlocksToProcess").mockResolvedValue([
              {
                block: null,
                blockDetails: null,
              } as BlockInfo,
            ]);
          });

          it("triggers blocks revert event and returns false", async () => {
            const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
            expect(eventEmitterMock.emit).toBeCalledWith(BLOCKS_REVERT_DETECTED_EVENT, {
              detectedIncorrectBlockNumber: 100,
            });
            expect(isNextBlockRangeProcessed).toBeFalsy();
          });

          describe("when blocks revert is disabled", () => {
            it("does not trigger the revert event", async () => {
              (configServiceMock.get as jest.Mock)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(true);
              blockProcessor = await getBlockProcessor();
              const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
              expect(eventEmitterMock.emit).not.toBeCalled();
              expect(isNextBlockRangeProcessed).toBeFalsy();
            });
          });
        });

        describe("and revert is not detected", () => {
          describe("and not all the blocks to process requested exist in blockchain", () => {
            it("does not trigger revert event, does not process any blocks and returns false", async () => {
              jest.spyOn(blockWatcherMock, "getNextBlocksToProcess").mockResolvedValue([
                {
                  block: {
                    number: 101,
                    parentHash: "hash",
                  },
                  blockDetails: {},
                } as BlockInfo,
                {
                  block: null,
                  blockDetails: null,
                } as BlockInfo,
              ]);

              const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
              expect(eventEmitterMock.emit).not.toBeCalled();
              expect(unitOfWorkMock.useTransaction).not.toBeCalled();
              expect(isNextBlockRangeProcessed).toBeFalsy();
            });
          });

          describe("and not all the blocks to process have correct hash linking", () => {
            it("does not trigger revert event, does not process any blocks and returns false", async () => {
              jest.spyOn(blockWatcherMock, "getNextBlocksToProcess").mockResolvedValue([
                {
                  block: {
                    number: 101,
                    hash: "hash2",
                    parentHash: "hash",
                  },
                  blockDetails: {},
                } as BlockInfo,
                {
                  block: {
                    number: 102,
                    hash: "hash3",
                    parentHash: "wrong-parent-hash",
                  },
                  blockDetails: {},
                } as BlockInfo,
              ]);

              const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
              expect(eventEmitterMock.emit).not.toBeCalled();
              expect(unitOfWorkMock.useTransaction).not.toBeCalled();
              expect(isNextBlockRangeProcessed).toBeFalsy();
            });
          });

          describe("and all the blocks are good to be added", () => {
            let blocksToProcess: BlockInfo[];

            beforeEach(() => {
              blocksToProcess = [
                {
                  block: {
                    number: 101,
                    hash: "hash2",
                    parentHash: "hash",
                    transactions: ["0", "1"],
                  },
                  blockDetails: {
                    number: 10,
                    l1BatchNumber: 3,
                  },
                } as BlockInfo,
              ];
              jest.spyOn(blockWatcherMock, "getNextBlocksToProcess").mockResolvedValue(blocksToProcess);
            });

            it("starts the duration metric", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(startBlocksBatchDurationMetricMock).toHaveBeenCalledTimes(1);
            });

            it("uses transaction when adding blocks", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(unitOfWorkMock.useTransaction).toHaveBeenCalledTimes(1);
            });

            it("starts the duration metric", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(startBlockDurationMetricMock).toHaveBeenCalledTimes(1);
            });

            it("adds blocks to the DB", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(blockRepositoryMock.add).toHaveBeenCalledTimes(1);
              expect(blockRepositoryMock.add).toHaveBeenCalledWith(
                blocksToProcess[0].block,
                blocksToProcess[0].blockDetails
              );
            });

            it("adds blocks transactions data", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(transactionProcessorMock.add).toHaveBeenCalledTimes(2);
              expect(transactionProcessorMock.add).toHaveBeenCalledWith(
                blocksToProcess[0].block.transactions[0],
                blocksToProcess[0].blockDetails
              );
              expect(transactionProcessorMock.add).toHaveBeenCalledWith(
                blocksToProcess[0].block.transactions[1],
                blocksToProcess[0].blockDetails
              );
            });

            describe("when processing fails with an error", () => {
              beforeEach(() => {
                jest.spyOn(blockRepositoryMock, "add").mockRejectedValue(new Error("getBlock error"));
              });

              it("throws the generated error", async () => {
                await expect(blockProcessor.processNextBlocksRange()).rejects.toThrowError(new Error("getBlock error"));
              });

              it("stops block batch duration metric and sets label to error", async () => {
                expect.assertions(2);
                try {
                  await blockProcessor.processNextBlocksRange();
                } catch {
                  expect(stopBlocksBatchDurationMetricMock).toHaveBeenCalledTimes(1);
                  expect(stopBlocksBatchDurationMetricMock).toHaveBeenCalledWith({
                    status: "error",
                  });
                }
              });

              it("stops the duration metric", async () => {
                expect.assertions(1);
                try {
                  await blockProcessor.processNextBlocksRange();
                } catch {
                  expect(stopBlockDurationMetricMock).toHaveBeenCalledTimes(1);
                }
              });

              it("sets duration metric label to error", async () => {
                expect.assertions(1);
                try {
                  await blockProcessor.processNextBlocksRange();
                } catch {
                  expect(stopBlockDurationMetricMock).toHaveBeenCalledWith({
                    status: "error",
                    action: "add",
                  });
                }
              });

              it("clears tracked address changes state", async () => {
                expect.assertions(1);
                try {
                  await blockProcessor.processNextBlocksRange();
                } catch {
                  expect(balanceServiceMock.clearTrackedState).toHaveBeenCalledTimes(1);
                }
              });
            });

            describe("when block does not contain transactions", () => {
              let logs: types.Log[];
              beforeEach(() => {
                blocksToProcess[0].block.transactions = [];
                logs = [mock<types.Log>({ logIndex: 0 }), mock<types.Log>({ logIndex: 1 })];
                jest.spyOn(blockchainServiceMock, "getLogs").mockResolvedValueOnce(logs);
              });

              it("reads logs for block from the blockchain", async () => {
                await blockProcessor.processNextBlocksRange();
                expect(blockchainServiceMock.getLogs).toHaveBeenCalledTimes(1);
                expect(blockchainServiceMock.getLogs).toHaveBeenCalledWith({
                  fromBlock: blocksToProcess[0].block.number,
                  toBlock: blocksToProcess[0].block.number,
                });
              });

              it("processes the logs", async () => {
                await blockProcessor.processNextBlocksRange();
                expect(logProcessorMock.process).toHaveBeenCalledTimes(1);
                expect(logProcessorMock.process).toHaveBeenCalledWith(logs, blocksToProcess[0].blockDetails);
              });
            });

            it("starts the balances duration metric", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(startBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
            });

            it("saves changed balances", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(balanceServiceMock.saveChangedBalances).toHaveBeenCalledTimes(1);
              expect(balanceServiceMock.saveChangedBalances).toHaveBeenCalledWith(blocksToProcess[0].block.number);
            });

            it("stops the balances duration metric", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(stopBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
            });

            it("stops the duration metric", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(stopBlockDurationMetricMock).toHaveBeenCalledTimes(1);
            });

            it("sets duration metric label to success", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(stopBlockDurationMetricMock).toHaveBeenCalledWith({
                status: "success",
                action: "add",
              });
            });

            it("clears tracked address changes state", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(balanceServiceMock.clearTrackedState).toHaveBeenCalledTimes(1);
            });

            it("stops block batch duration metric and sets label to success", async () => {
              await blockProcessor.processNextBlocksRange();
              expect(stopBlocksBatchDurationMetricMock).toHaveBeenCalledTimes(1);
              expect(stopBlocksBatchDurationMetricMock).toHaveBeenCalledWith({
                status: "success",
              });
            });

            it("returns true", async () => {
              const isNextBlockRangeProcessed = await blockProcessor.processNextBlocksRange();
              expect(isNextBlockRangeProcessed).toBeTruthy();
            });
          });
        });
      });
    });
  });
});
