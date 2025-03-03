import { mock } from "jest-mock-extended";
const baseSendPromise = jest.fn();
class JsonRpcProviderBaseMock {
  public send() {
    return baseSendPromise();
  }
}
jest.mock("../logger");
jest.useFakeTimers();
jest.mock("zksync-ethers", () => ({
  Provider: JsonRpcProviderBaseMock,
}));
import { JsonRpcProviderExtended } from "./jsonRpcProviderExtended";

describe("JsonRpcProviderExtended", () => {
  let jsonRpcProvider: JsonRpcProviderExtended;
  const timer = mock<NodeJS.Timeout>();
  let lastCallback: () => void;

  const quickTimeout = 10_000;
  const batchMaxCount = 10;
  const batchMaxSizeBytes = 5_000;
  const batchStallTimeMs = 7_000;
  const rpcUrl = "url";

  beforeEach(async () => {
    jsonRpcProvider = new JsonRpcProviderExtended(
      rpcUrl,
      120_000,
      quickTimeout,
      batchMaxCount,
      batchMaxSizeBytes,
      batchStallTimeMs
    );

    jest.spyOn(global, "setTimeout").mockImplementation((callback: () => void) => {
      lastCallback = callback;
      return timer;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("send", () => {
    it("calls base implementation and returns its value", async () => {
      baseSendPromise.mockResolvedValueOnce({
        method: "method",
        params: [1, 2],
      });
      const result = await jsonRpcProvider.send("method", [1, 2]);
      expect(result).toStrictEqual({
        method: "method",
        params: [1, 2],
      });
    });

    it("starts quick timeout", async () => {
      await jsonRpcProvider.send("method", [1, 2]);
      expect(global.setTimeout).toBeCalledTimes(1);
      expect(global.setTimeout).toBeCalledWith(expect.any(Function), quickTimeout);
    });

    it("clears quick timeout", async () => {
      jest.spyOn(global, "clearTimeout");
      await jsonRpcProvider.send("method", [1, 2]);
      expect(global.clearTimeout).toBeCalledTimes(1);
      expect(global.clearTimeout).toBeCalledWith(timer);
    });

    describe("when base send throws an error", () => {
      const error = new Error("test error");
      beforeEach(() => {
        baseSendPromise.mockRejectedValue(error);
      });

      it("throws the same error", async () => {
        await expect(jsonRpcProvider.send("method", [1, 2])).rejects.toThrowError(error);
      });
    });

    describe("when timeout occurs faster than send returns value", () => {
      beforeEach(() => {
        baseSendPromise.mockImplementationOnce(() => {
          lastCallback();
          return {
            method: "method1",
            params: [1, 2],
          };
        });
        baseSendPromise.mockResolvedValueOnce({
          method: "method2",
          params: [2, 3],
        });
      });

      it("waits for internal timeout and returns the result of the second call", async () => {
        const result = await jsonRpcProvider.send("method", [1, 2]);
        expect(global.setTimeout).toBeCalledTimes(1);
        expect(global.setTimeout).toBeCalledWith(expect.any(Function), quickTimeout);
        expect(result).toStrictEqual({
          method: "method2",
          params: [2, 3],
        });
      });

      it("when timeout is already cleared does not throw an error", async () => {
        baseSendPromise.mockImplementationOnce(() => {
          lastCallback();
          return {
            method: "method1",
            params: [1, 2],
          };
        });
        jest.spyOn(global, "setTimeout").mockImplementation((callback: () => void) => {
          lastCallback = callback;
          return null;
        });
        const result = await jsonRpcProvider.send("method", [1, 2]);
        expect(result).toBeUndefined();
      });
    });
  });

  describe("getState", () => {
    it("returns open", () => {
      const state = jsonRpcProvider.getState();
      expect(state).toBe("open");
    });
  });
});
