import { mock } from "jest-mock-extended";
import waitFor from "../utils/waitFor";
import { BatchProcessor } from "./batch.processor";
import { BatchWorker } from "./batch.worker";

jest.mock("../utils/waitFor");

describe("BatchWorker", () => {
  let batchProcessorMock: BatchProcessor;
  let batchWorker: BatchWorker;

  beforeEach(() => {
    (waitFor as jest.Mock).mockResolvedValue(null);
    batchProcessorMock = mock<BatchProcessor>({
      processNextBatch: jest.fn().mockResolvedValue(false),
      resetState: jest.fn(),
    });
    batchWorker = new BatchWorker(batchProcessorMock, 30000);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("start", () => {
    it("starts batch processing processes", async () => {
      batchWorker.start();
      await batchWorker.stop();

      expect(batchProcessorMock.processNextBatch).toBeCalledTimes(1);
    });

    it("waits for timeout or worker stoppage when processNextBatch returns false", async () => {
      batchWorker.start();
      await batchWorker.stop();

      const [conditionPredicate, maxWaitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(maxWaitTime).toBe(30000);
    });

    it("does not wait for timeout when processNextBatch returns true", async () => {
      jest.spyOn(batchProcessorMock, "processNextBatch").mockResolvedValue(true);
      batchWorker.start();
      await batchWorker.stop();

      expect(waitFor).not.toBeCalled();
    });

    it("starts the process only once when called multiple times", async () => {
      batchWorker.start();
      batchWorker.start();
      await batchWorker.stop();

      expect(batchProcessorMock.processNextBatch).toBeCalledTimes(1);
    });

    it("processes next batches iteratively until stopped", async () => {
      let secondIterationResolve: (value: unknown) => void;
      const secondIterationPromise = new Promise((resolve) => (secondIterationResolve = resolve));
      jest
        .spyOn(batchProcessorMock, "processNextBatch")
        .mockResolvedValueOnce(true)
        .mockImplementationOnce(() => {
          secondIterationResolve(null);
          return Promise.resolve(true);
        })
        .mockResolvedValueOnce(true);

      batchWorker.start();

      await secondIterationPromise;
      await batchWorker.stop();
      expect(batchProcessorMock.processNextBatch).toBeCalledTimes(2);
    });
  });

  describe("stop", () => {
    it("resets batch processor state", async () => {
      batchWorker.start();
      await batchWorker.stop();

      expect(batchProcessorMock.resetState).toBeCalledTimes(1);
    });

    it("stops batch processing processes", async () => {
      batchWorker.start();
      await batchWorker.stop();

      expect(batchProcessorMock.processNextBatch).toBeCalledTimes(1);
    });
  });
});
