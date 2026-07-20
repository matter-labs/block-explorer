import { mock } from "jest-mock-extended";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { type Block as EthersBlock, type BlockTag } from "ethers";
import waitFor from "../utils/waitFor";
import { BlockchainService } from "../blockchain";
import { BlockRepository, IndexerStateRepository } from "../repositories";
import { BlockStatus, Block } from "../entities";
import { BlockStatusService } from "./blockStatus.service";

jest.mock("../utils/waitFor");

describe("BlockStatusService", () => {
  const pollingInterval = 1000;

  let blockStatusService: BlockStatusService;
  let blockchainServiceMock: BlockchainService;
  let blockRepositoryMock: BlockRepository;
  let indexerStateRepositoryMock: IndexerStateRepository;
  let configServiceMock: ConfigService;

  beforeEach(async () => {
    (waitFor as jest.Mock).mockResolvedValue(null);

    blockchainServiceMock = mock<BlockchainService>({
      getBlock: jest.fn().mockImplementation((blockHashOrTag: BlockTag) => {
        if (blockHashOrTag === "finalized") {
          return Promise.resolve({ number: 150, hash: "hash150" } as EthersBlock);
        }
        if (blockHashOrTag === "safe") {
          return Promise.resolve({ number: 200, hash: "hash200" } as EthersBlock);
        }
        return Promise.resolve({ number: blockHashOrTag, hash: `hash${blockHashOrTag}` } as EthersBlock);
      }),
    });

    blockRepositoryMock = mock<BlockRepository>({
      getBlock: jest.fn().mockImplementation(({ where } = {}) => {
        if (where && "number" in where) {
          // last ready block lookup by number — used for hash verification
          return Promise.resolve({ number: 200, hash: "hash200" } as Block);
        }
        // first block with smaller status call
        return Promise.resolve({ number: 1 } as Block);
      }),
      updateByRange: jest.fn().mockResolvedValue(null),
    });

    indexerStateRepositoryMock = mock<IndexerStateRepository>({
      getLastReadyBlockNumber: jest.fn().mockResolvedValue(200),
    });

    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(pollingInterval),
    });

    const app = await Test.createTestingModule({
      providers: [
        BlockStatusService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        {
          provide: BlockRepository,
          useValue: blockRepositoryMock,
        },
        {
          provide: IndexerStateRepository,
          useValue: indexerStateRepositoryMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    blockStatusService = app.get(BlockStatusService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("start", () => {
    it("starts the process only once when called multiple times", async () => {
      blockStatusService.start();
      blockStatusService.start();
      await blockStatusService.stop();

      expect(blockRepositoryMock.updateByRange).toBeCalledTimes(2);
    });

    it("waits for the configured polling interval between iterations", async () => {
      blockStatusService.start();
      await blockStatusService.stop();

      const [, maxWaitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(maxWaitTime).toBe(pollingInterval);
    });

    it("processes status updates iteratively until stopped", async () => {
      let secondIterationResolve: (value: unknown) => void;
      const secondIterationPromise = new Promise((resolve) => (secondIterationResolve = resolve));

      jest
        .spyOn(blockRepositoryMock, "updateByRange")
        .mockResolvedValueOnce(null)
        .mockImplementationOnce(() => {
          secondIterationResolve(null);
          return Promise.resolve(null);
        });

      blockStatusService.start();
      await secondIterationPromise;
      await blockStatusService.stop();

      expect(blockRepositoryMock.updateByRange).toBeCalledTimes(2);
    });

    describe("when blockchain returns no block for the requested status tag", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getBlock").mockResolvedValue(null);
      });

      it("does not update any blocks status", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(blockRepositoryMock.updateByRange).not.toBeCalled();
      });
    });

    describe("when there are no blocks in DB", () => {
      beforeEach(() => {
        jest.spyOn(blockRepositoryMock, "getBlock").mockResolvedValue(null);
      });

      it("does not update any blocks status", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(blockRepositoryMock.updateByRange).not.toBeCalled();
      });
    });

    describe("when the latest DB block does not exist on blockchain", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getBlock").mockImplementation((blockHashOrTag: BlockTag) => {
          if (blockHashOrTag === "finalized") {
            return Promise.resolve({ number: 150, hash: "hash150" } as EthersBlock);
          }
          if (blockHashOrTag === "safe") {
            return Promise.resolve({ number: 200, hash: "hash200" } as EthersBlock);
          }
          return Promise.resolve(null);
        });
      });

      it("does not update any blocks status", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(blockRepositoryMock.updateByRange).not.toBeCalled();
      });
    });

    describe("when the last ready block hash does not match the blockchain block hash", () => {
      beforeEach(() => {
        jest.spyOn(blockRepositoryMock, "getBlock").mockImplementation(({ where } = {}) => {
          if (where && "number" in where) {
            return Promise.resolve({ number: 200, hash: "different-hash" } as Block);
          }
          return Promise.resolve({ number: 1 } as Block);
        });
      });

      it("does not update any blocks status", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(blockRepositoryMock.updateByRange).not.toBeCalled();
      });
    });

    describe("when the last ready block number is 0", () => {
      beforeEach(() => {
        jest.spyOn(indexerStateRepositoryMock, "getLastReadyBlockNumber").mockResolvedValue(0);
      });

      it("does not update any blocks status", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(blockRepositoryMock.updateByRange).not.toBeCalled();
      });
    });

    describe("when the last ready block clamps the update range", () => {
      beforeEach(() => {
        jest.spyOn(indexerStateRepositoryMock, "getLastReadyBlockNumber").mockResolvedValue(120);
        jest.spyOn(blockRepositoryMock, "getBlock").mockImplementation(({ where } = {}) => {
          if (where && "number" in where) {
            return Promise.resolve({ number: 120, hash: "hash120" } as Block);
          }
          return Promise.resolve({ number: 1 } as Block);
        });
      });

      it("clamps finalized update to last ready block", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(blockRepositoryMock.updateByRange).toBeCalledWith(1, 120, { status: BlockStatus.Executed });
      });
    });

    describe("when there are no blocks with a smaller status in DB", () => {
      beforeEach(() => {
        jest.spyOn(blockRepositoryMock, "getBlock").mockImplementation(({ where } = {}) => {
          if (where && "number" in where) {
            return Promise.resolve({ number: 200, hash: "hash200" } as Block);
          }
          return Promise.resolve(null);
        });
      });

      it("does not update any blocks status", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(blockRepositoryMock.updateByRange).not.toBeCalled();
      });
    });

    describe("when all conditions are met", () => {
      it("updates finalized blocks to Executed status for the correct range", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(blockRepositoryMock.updateByRange).toBeCalledWith(1, 150, { status: BlockStatus.Executed });
      });

      it("updates safe blocks to Committed status for the correct range", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(blockRepositoryMock.updateByRange).toBeCalledWith(1, 200, { status: BlockStatus.Committed });
      });
    });

    describe("when an error is thrown during status update", () => {
      beforeEach(() => {
        jest.spyOn(blockchainServiceMock, "getBlock").mockRejectedValue(new Error("blockchain error"));
      });

      it("does not throw and continues to the next iteration", async () => {
        blockStatusService.start();
        await expect(blockStatusService.stop()).resolves.not.toThrow();
      });

      it("still waits for the configured polling interval", async () => {
        blockStatusService.start();
        await blockStatusService.stop();

        expect(waitFor).toBeCalledTimes(1);
      });
    });
  });

  describe("stop", () => {
    it("stops the processing loop", async () => {
      blockStatusService.start();
      await blockStatusService.stop();

      expect(blockRepositoryMock.updateByRange).toBeCalledTimes(2);
    });
  });
});
