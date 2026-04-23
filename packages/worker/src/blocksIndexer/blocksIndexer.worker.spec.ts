import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import waitFor from "../utils/waitFor";
import { BlocksIndexerProcessor } from "./blocksIndexer.processor";
import { BlocksIndexerWorker } from "./blocksIndexer.worker";
import { RetryDelayProvider } from "../retryDelay.provider";

jest.mock("../utils/waitFor");
jest.mock("@nestjs/common", () => ({
  ...jest.requireActual("@nestjs/common"),
  Logger: jest.fn(),
}));

describe("BlocksIndexerWorker", () => {
  const retryDelay = 750;
  const waitForBlocksInterval = 1000;

  let blockProcessorMock: BlocksIndexerProcessor;
  let retryDelayProviderMock: RetryDelayProvider;
  let configServiceMock: ConfigService;
  let blockWorker: BlocksIndexerWorker;

  beforeEach(() => {
    (Logger as unknown as jest.Mock).mockReturnValue({
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    });
    (waitFor as jest.Mock).mockResolvedValue(null);
    blockProcessorMock = mock<BlocksIndexerProcessor>({
      processNextBlocksRange: jest.fn().mockResolvedValue(false),
    });
    retryDelayProviderMock = mock<RetryDelayProvider>({
      resetRetryDelay: jest.fn(),
      getRetryDelay: jest.fn().mockReturnValue(retryDelay),
    });
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(waitForBlocksInterval),
    });

    blockWorker = new BlocksIndexerWorker(blockProcessorMock, retryDelayProviderMock, configServiceMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("start", () => {
    it("starts blocks processing with processNextBlocksRange call", async () => {
      blockWorker.start();
      await blockWorker.stop();

      expect(blockProcessorMock.processNextBlocksRange).toBeCalledTimes(1);
    });

    it("resets retry delay and waits for timeout or worker stoppage when processNextBlocksRange returns false", async () => {
      blockWorker.start();
      await blockWorker.stop();

      const [conditionPredicate, maxWaitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(maxWaitTime).toBe(waitForBlocksInterval);
      expect(retryDelayProviderMock.resetRetryDelay).toHaveBeenCalledTimes(1);
    });

    it("resets retry delay and does not wait for timeout when processNextBlocksRange returns true", async () => {
      (blockProcessorMock.processNextBlocksRange as jest.Mock).mockResolvedValue(true);
      blockWorker.start();
      await blockWorker.stop();

      expect(waitFor).not.toBeCalled();
      expect(retryDelayProviderMock.resetRetryDelay).toHaveBeenCalledTimes(1);
    });

    it("waits for retry delay or worker stoppage when processNextBlocksRange fails", async () => {
      (blockProcessorMock.processNextBlocksRange as jest.Mock).mockRejectedValue(new Error("error"));
      blockWorker.start();
      await blockWorker.stop();

      const [conditionPredicate, maxWaitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(maxWaitTime).toBe(retryDelay);
      expect(retryDelayProviderMock.resetRetryDelay).not.toHaveBeenCalled();
    });

    it("starts the process only once when called multiple times", async () => {
      blockWorker.start();
      blockWorker.start();
      await blockWorker.stop();

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

      blockWorker.start();

      await secondIterationPromise;
      await blockWorker.stop();
      expect(blockProcessorMock.processNextBlocksRange).toBeCalledTimes(2);
    });
  });

  describe("stop", () => {
    it("stops block processing", async () => {
      blockWorker.start();
      await blockWorker.stop();

      expect(blockProcessorMock.processNextBlocksRange).toBeCalledTimes(1);
    });
  });
});
