import { mock } from "jest-mock-extended";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import waitFor from "../utils/waitFor";
import { BlockProcessor } from "./block.processor";
import { BlockService } from "./block.service";
import { RetryDelayProvider } from "../retryDelay.provider";

jest.mock("../utils/waitFor");

describe("BlockService", () => {
  const retryDelay = 750;
  const waitForBlocksInterval = 1000;

  let blockProcessorMock: BlockProcessor;
  let retryDelayProviderMock: RetryDelayProvider;
  let configServiceMock: ConfigService;
  let blockService: BlockService;

  beforeEach(async () => {
    (waitFor as jest.Mock).mockResolvedValue(null);
    blockProcessorMock = mock<BlockProcessor>({
      processNextBlocksRange: jest.fn().mockResolvedValue(false),
    });
    retryDelayProviderMock = mock<RetryDelayProvider>({
      resetRetryDelay: jest.fn(),
      getRetryDelay: jest.fn().mockReturnValue(retryDelay),
    });
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(waitForBlocksInterval),
    });

    const app = await Test.createTestingModule({
      providers: [
        BlockService,
        {
          provide: BlockProcessor,
          useValue: blockProcessorMock,
        },
        {
          provide: RetryDelayProvider,
          useValue: retryDelayProviderMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    blockService = app.get(BlockService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("start", () => {
    it("starts blocks processing processes with processNextBlocksRange call", async () => {
      blockService.start();
      await blockService.stop();

      expect(blockProcessorMock.processNextBlocksRange).toBeCalledTimes(1);
    });

    it("resets retry delay and waits for timeout or service stoppage when processNextBlocksRange returns false", async () => {
      blockService.start();
      await blockService.stop();

      const [conditionPredicate, maxWaitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(maxWaitTime).toBe(waitForBlocksInterval);
      expect(retryDelayProviderMock.resetRetryDelay).toHaveBeenCalledTimes(1);
    });

    it("resets retry delay and does not wait for timeout when processNextBlocksRange returns true", async () => {
      (blockProcessorMock.processNextBlocksRange as jest.Mock).mockResolvedValue(true);
      blockService.start();
      await blockService.stop();

      expect(waitFor).not.toBeCalled();
      expect(retryDelayProviderMock.resetRetryDelay).toHaveBeenCalledTimes(1);
    });

    it("waits for retry delay or service stoppage when processNextBlocksRange fails", async () => {
      (blockProcessorMock.processNextBlocksRange as jest.Mock).mockRejectedValue(new Error("error"));
      blockService.start();
      await blockService.stop();

      const [conditionPredicate, maxWaitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(maxWaitTime).toBe(retryDelay);
      expect(retryDelayProviderMock.resetRetryDelay).not.toHaveBeenCalled();
    });

    it("starts the process only once when called multiple times", async () => {
      blockService.start();
      blockService.start();
      await blockService.stop();

      expect(blockProcessorMock.processNextBlocksRange).toBeCalledTimes(1);
    });

    it("processes next blocks range iteratively until stopped", async () => {
      let secondIterationResolve: (value: unknown) => void;
      const secondIterationPromise = new Promise((resolve) => (secondIterationResolve = resolve));
      jest
        .spyOn(blockProcessorMock, "processNextBlocksRange")
        .mockResolvedValueOnce(true)
        .mockImplementationOnce(() => {
          secondIterationResolve(null);
          return Promise.resolve(true);
        })
        .mockResolvedValueOnce(true);

      blockService.start();

      await secondIterationPromise;
      await blockService.stop();
      expect(blockProcessorMock.processNextBlocksRange).toBeCalledTimes(2);
    });
  });

  describe("stop", () => {
    it("stops block processing processes", async () => {
      blockService.start();
      await blockService.stop();

      expect(blockProcessorMock.processNextBlocksRange).toBeCalledTimes(1);
    });
  });
});
