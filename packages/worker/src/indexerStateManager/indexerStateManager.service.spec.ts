import { mock } from "jest-mock-extended";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Logger } from "@nestjs/common";
import waitFor from "../utils/waitFor";
import { BlockRepository, IndexerStateRepository } from "../repositories";
import { IndexerStateManagerService } from "./indexerStateManager.service";
import { BLOCKS_REVERT_DETECTED_EVENT } from "../constants";

jest.mock("../utils/waitFor");

describe("IndexerStateManagerService", () => {
  const pollingInterval = 1000;

  let service: IndexerStateManagerService;
  let blockRepositoryMock: BlockRepository;
  let indexerStateRepositoryMock: IndexerStateRepository;
  let eventEmitterMock: EventEmitter2;
  let configServiceMock: ConfigService;

  const buildService = async ({ disableBlocksRevert = false }: { disableBlocksRevert?: boolean } = {}) => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case "blocks.enqueuerPollingInterval":
            return pollingInterval;
          case "blocks.disableBlocksRevert":
            return disableBlocksRevert;
          default:
            return undefined;
        }
      }),
    });
    const app = await Test.createTestingModule({
      providers: [
        IndexerStateManagerService,
        { provide: BlockRepository, useValue: blockRepositoryMock },
        { provide: IndexerStateRepository, useValue: indexerStateRepositoryMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();
    app.useLogger(mock<Logger>());
    service = app.get(IndexerStateManagerService);
  };

  beforeEach(() => {
    (waitFor as jest.Mock).mockResolvedValue(null);

    blockRepositoryMock = mock<BlockRepository>({
      getStateAboveLastReadyBlock: jest
        .fn()
        .mockResolvedValue({ firstIncorrectBlockNumber: null, lastCorrectBlockNumber: 150 }),
    });
    indexerStateRepositoryMock = mock<IndexerStateRepository>({
      getLastReadyBlockNumber: jest.fn().mockResolvedValue(100),
      setLastReadyBlockNumber: jest.fn().mockResolvedValue(null),
    });
    eventEmitterMock = mock<EventEmitter2>({
      emit: jest.fn().mockReturnValue(true),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("start", () => {
    it("advances last ready block number to max block when chain is intact", async () => {
      await buildService();
      service.start();
      await service.stop();

      expect(blockRepositoryMock.getStateAboveLastReadyBlock).toBeCalledWith(100);
      expect(indexerStateRepositoryMock.setLastReadyBlockNumber).toBeCalledWith(150);
      expect(eventEmitterMock.emit).not.toBeCalled();
    });

    it("does not advance when there are no blocks above last ready block", async () => {
      jest
        .spyOn(blockRepositoryMock, "getStateAboveLastReadyBlock")
        .mockResolvedValue({ firstIncorrectBlockNumber: null, lastCorrectBlockNumber: null });

      await buildService();
      service.start();
      await service.stop();

      expect(indexerStateRepositoryMock.setLastReadyBlockNumber).not.toBeCalled();
      expect(eventEmitterMock.emit).not.toBeCalled();
    });

    it("does not advance when max block equals current last ready block", async () => {
      jest
        .spyOn(blockRepositoryMock, "getStateAboveLastReadyBlock")
        .mockResolvedValue({ firstIncorrectBlockNumber: null, lastCorrectBlockNumber: 100 });

      await buildService();
      service.start();
      await service.stop();

      expect(indexerStateRepositoryMock.setLastReadyBlockNumber).not.toBeCalled();
      expect(eventEmitterMock.emit).not.toBeCalled();
    });

    describe("when an adjacent chain mismatch is detected (firstIncorrect - lastCorrect === 1)", () => {
      beforeEach(() => {
        jest
          .spyOn(blockRepositoryMock, "getStateAboveLastReadyBlock")
          .mockResolvedValue({ firstIncorrectBlockNumber: 131, lastCorrectBlockNumber: 130 });
      });

      it("emits blocks revert event with first incorrect block number", async () => {
        await buildService();
        service.start();
        await service.stop();

        expect(eventEmitterMock.emit).toBeCalledWith(BLOCKS_REVERT_DETECTED_EVENT, {
          detectedIncorrectBlockNumber: 131,
        });
      });

      it("does not advance the last ready block when mismatch is detected", async () => {
        await buildService();
        service.start();
        await service.stop();

        expect(indexerStateRepositoryMock.setLastReadyBlockNumber).not.toBeCalled();
      });

      it("does not emit revert event when blocks revert is disabled", async () => {
        await buildService({ disableBlocksRevert: true });
        service.start();
        await service.stop();

        expect(eventEmitterMock.emit).not.toBeCalled();
      });
    });

    describe("when a gap is detected (firstIncorrect - lastCorrect > 1)", () => {
      beforeEach(() => {
        jest
          .spyOn(blockRepositoryMock, "getStateAboveLastReadyBlock")
          .mockResolvedValue({ firstIncorrectBlockNumber: 131, lastCorrectBlockNumber: 120 });
      });

      it("does not emit revert event for gaps", async () => {
        await buildService();
        service.start();
        await service.stop();

        expect(eventEmitterMock.emit).not.toBeCalled();
      });

      it("advances the watermark to the last correct block before the gap", async () => {
        await buildService();
        service.start();
        await service.stop();

        expect(indexerStateRepositoryMock.setLastReadyBlockNumber).toBeCalledWith(120);
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

    it("keeps iterating when getStateAboveLastReadyBlock throws", async () => {
      jest
        .spyOn(blockRepositoryMock, "getStateAboveLastReadyBlock")
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce({ firstIncorrectBlockNumber: null, lastCorrectBlockNumber: 150 });

      let secondIterationResolve: (value: unknown) => void;
      const secondIterationPromise = new Promise((resolve) => (secondIterationResolve = resolve));
      jest.spyOn(indexerStateRepositoryMock, "getLastReadyBlockNumber").mockImplementation(async () => {
        if ((indexerStateRepositoryMock.getLastReadyBlockNumber as jest.Mock).mock.calls.length === 2) {
          secondIterationResolve(null);
        }
        return 100;
      });

      await buildService();
      service.start();
      await secondIterationPromise;
      await service.stop();

      expect(blockRepositoryMock.getStateAboveLastReadyBlock).toBeCalledTimes(2);
      expect(indexerStateRepositoryMock.setLastReadyBlockNumber).toBeCalledWith(150);
    });
  });
});
