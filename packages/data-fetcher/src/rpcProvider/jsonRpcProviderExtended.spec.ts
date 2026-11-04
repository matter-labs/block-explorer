import { mock } from "jest-mock-extended";
const baseSendPromise = jest.fn();
class JsonRpcProviderBaseMock {
  public send(method: string, params: Array<any>) {
    return baseSendPromise(method, params);
  }
}
jest.mock("../logger");
jest.useFakeTimers();
jest.mock("ethers", () => ({
  ...jest.requireActual("ethers"),
  JsonRpcProvider: JsonRpcProviderBaseMock,
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

  describe("send with calls from address", () => {
    const callsFromAddress = "0x0000000000000000000000000000000000008001";
    const callRequest = { to: "0x280a5669b23898ecc307fa398694cc0feedc9985", data: "0x95d89b41" };

    beforeEach(() => {
      baseSendPromise.mockReset();
      jsonRpcProvider = new JsonRpcProviderExtended(
        rpcUrl,
        120_000,
        quickTimeout,
        batchMaxCount,
        batchMaxSizeBytes,
        batchStallTimeMs,
        callsFromAddress
      );
    });

    it("adds from address to eth_call requests", async () => {
      await jsonRpcProvider.send("eth_call", [callRequest, "latest"]);
      expect(baseSendPromise).toBeCalledWith("eth_call", [{ ...callRequest, from: callsFromAddress }, "latest"]);
    });

    it("does not override from address specified in eth_call request", async () => {
      const from = "0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c";
      await jsonRpcProvider.send("eth_call", [{ ...callRequest, from }, "latest"]);
      expect(baseSendPromise).toBeCalledWith("eth_call", [{ ...callRequest, from }, "latest"]);
    });

    it("does not add from address to other requests", async () => {
      await jsonRpcProvider.send("eth_getBalance", ["0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c", "latest"]);
      expect(baseSendPromise).toBeCalledWith("eth_getBalance", [
        "0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c",
        "latest",
      ]);
    });
  });

  describe("send without calls from address", () => {
    beforeEach(() => {
      baseSendPromise.mockReset();
    });

    it("sends eth_call requests as is", async () => {
      const callRequest = { to: "0x280a5669b23898ecc307fa398694cc0feedc9985", data: "0x95d89b41" };
      await jsonRpcProvider.send("eth_call", [callRequest, "latest"]);
      expect(baseSendPromise).toBeCalledWith("eth_call", [callRequest, "latest"]);
    });
  });

  describe("getState", () => {
    it("returns open", () => {
      const state = jsonRpcProvider.getState();
      expect(state).toBe("open");
    });
  });
});
