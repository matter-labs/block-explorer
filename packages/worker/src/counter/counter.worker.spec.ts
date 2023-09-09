import { mock } from "jest-mock-extended";
import waitFor from "../utils/waitFor";
import { Transaction } from "../entities";
import { CounterProcessor } from "./counter.processor";
import { CounterWorker } from "./counter.worker";

jest.mock("../utils/waitFor");

describe("CounterWorker", () => {
  let counterProcessorMock: CounterProcessor<Transaction>;
  let counterWorker: CounterWorker<Transaction>;

  beforeEach(() => {
    (waitFor as jest.Mock).mockResolvedValue(null);
    counterProcessorMock = mock<CounterProcessor<Transaction>>({
      processNextRecordsBatch: jest.fn().mockResolvedValue(false),
    });
    counterWorker = new CounterWorker(counterProcessorMock, 30000);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("start", () => {
    it("starts counter processing processes", async () => {
      counterWorker.start();
      await counterWorker.stop();

      expect(counterProcessorMock.processNextRecordsBatch).toBeCalledTimes(1);
    });

    it("waits for timeout or worker stoppage when processNextRecordsBatch returns false", async () => {
      counterWorker.start();
      await counterWorker.stop();

      const [conditionPredicate, maxWaitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(maxWaitTime).toBe(30000);
    });

    it("does not wait for timeout when processNextRecordsBatch returns true", async () => {
      jest.spyOn(counterProcessorMock, "processNextRecordsBatch").mockResolvedValue(true);
      counterWorker.start();
      await counterWorker.stop();

      expect(waitFor).not.toBeCalled();
    });

    it("starts the process only once when called multiple times", async () => {
      counterWorker.start();
      counterWorker.start();
      await counterWorker.stop();

      expect(counterProcessorMock.processNextRecordsBatch).toBeCalledTimes(1);
    });

    it("processes next records batches iteratively until stopped", async () => {
      let secondIterationResolve: (value: unknown) => void;
      const secondIterationPromise = new Promise((resolve) => (secondIterationResolve = resolve));
      jest
        .spyOn(counterProcessorMock, "processNextRecordsBatch")
        .mockResolvedValueOnce(true)
        .mockImplementationOnce(() => {
          secondIterationResolve(null);
          return Promise.resolve(true);
        })
        .mockResolvedValueOnce(true);

      counterWorker.start();

      await secondIterationPromise;
      await counterWorker.stop();
      expect(counterProcessorMock.processNextRecordsBatch).toBeCalledTimes(2);
    });
  });

  describe("stop", () => {
    it("stops batch processing processes", async () => {
      counterWorker.start();
      await counterWorker.stop();

      expect(counterProcessorMock.processNextRecordsBatch).toBeCalledTimes(1);
    });
  });

  describe("revert", () => {
    it("calls revert on injected counter processor instance", async () => {
      counterWorker.revert(100);
      expect(counterProcessorMock.revert).toBeCalledTimes(1);
      expect(counterProcessorMock.revert).toBeCalledWith(100);
    });
  });
});
