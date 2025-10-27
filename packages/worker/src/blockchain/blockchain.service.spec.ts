import { mock } from "jest-mock-extended";
import { Interface, TransactionReceipt, Log, Block, TransactionResponse } from "ethers";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as timersPromises from "timers/promises";
import { BlockchainService, BridgeAddresses } from "./blockchain.service";
import { JsonRpcProviderBase } from "../rpcProvider";
import { RetryableContract } from "./retryableContract";
import { ZERO_ADDRESS } from "../constants";
import * as erc20ABI from "../abis/erc20.json";

jest.mock("./retryableContract");

describe("BlockchainService", () => {
  const l2Erc20Bridge = "l2Erc20Bridge";
  let blockchainService: BlockchainService;
  let provider: JsonRpcProviderBase;
  let configServiceMock: ConfigService;
  let startRpcCallDurationMetricMock: jest.Mock;
  let stopRpcCallDurationMetricMock: jest.Mock;
  const defaultRetryTimeout = 2;
  const quickRetryTimeout = 1;

  beforeEach(async () => {
    provider = mock<JsonRpcProviderBase>();

    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((configName) => {
        return configName === "blockchain.rpcCallDefaultRetryTimeout" ? defaultRetryTimeout : quickRetryTimeout;
      }),
    });

    stopRpcCallDurationMetricMock = jest.fn();
    startRpcCallDurationMetricMock = jest.fn().mockReturnValue(stopRpcCallDurationMetricMock);

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: JsonRpcProviderBase,
          useValue: provider,
        },
        {
          provide: "PROM_METRIC_BLOCKCHAIN_RPC_CALL_DURATION_SECONDS",
          useValue: {
            startTimer: startRpcCallDurationMetricMock,
          },
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    blockchainService = app.get<BlockchainService>(BlockchainService);

    blockchainService.bridgeAddresses = mock<BridgeAddresses>({
      l2Erc20DefaultBridge: l2Erc20Bridge.toLowerCase(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getBlock", () => {
    const blockNumber = 10;
    const block: Block = mock<Block>({ number: 10 });
    let timeoutSpy;

    beforeEach(() => {
      jest.spyOn(provider, "getBlock").mockResolvedValue(block);
      timeoutSpy = jest.spyOn(timersPromises, "setTimeout");
    });

    it("starts the rpc call duration metric", async () => {
      await blockchainService.getBlock(blockNumber);
      expect(startRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("gets block by the specified block number", async () => {
      await blockchainService.getBlock(blockNumber);
      expect(provider.getBlock).toHaveBeenCalledTimes(1);
      expect(provider.getBlock).toHaveBeenCalledWith(blockNumber);
    });

    it("stops the rpc call duration metric", async () => {
      await blockchainService.getBlock(blockNumber);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getBlock" });
    });

    it("returns the block", async () => {
      const result = await blockchainService.getBlock(blockNumber);
      expect(result).toEqual(block);
    });

    describe("if the call throws an error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getBlock")
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockResolvedValueOnce(block);
      });

      it("retries RPC call with a default timeout", async () => {
        await blockchainService.getBlock(blockNumber);
        expect(provider.getBlock).toHaveBeenCalledTimes(3);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, defaultRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, defaultRetryTimeout);
      });

      it("stops the rpc call duration metric only for the successful retry", async () => {
        await blockchainService.getBlock(blockNumber);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getBlock" });
      });

      it("returns result of the successful RPC call", async () => {
        const result = await blockchainService.getBlock(blockNumber);
        expect(result).toEqual(block);
      });
    });

    describe("if the call throws a timeout error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getBlock")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(block);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getBlock(blockNumber);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });

    describe("if the call throws a connection refused error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getBlock")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(block);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getBlock(blockNumber);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });
  });

  describe("getBlockNumber", () => {
    const blockNumber = 10;
    let timeoutSpy;

    beforeEach(() => {
      jest.spyOn(provider, "getBlockNumber").mockResolvedValue(blockNumber);
      timeoutSpy = jest.spyOn(timersPromises, "setTimeout");
    });

    it("starts the rpc call duration metric", async () => {
      await blockchainService.getBlockNumber();
      expect(startRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("gets block number", async () => {
      await blockchainService.getBlockNumber();
      expect(provider.getBlockNumber).toHaveBeenCalledTimes(1);
    });

    it("stops the rpc call duration metric", async () => {
      await blockchainService.getBlockNumber();
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getBlockNumber" });
    });

    it("returns the block number", async () => {
      const result = await blockchainService.getBlockNumber();
      expect(result).toEqual(blockNumber);
    });

    describe("if the call throws an error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getBlockNumber")
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockResolvedValueOnce(blockNumber);
      });

      it("retries RPC call with a default timeout", async () => {
        await blockchainService.getBlockNumber();
        expect(provider.getBlockNumber).toHaveBeenCalledTimes(3);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, defaultRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, defaultRetryTimeout);
      });

      it("stops the rpc call duration metric only for the successful retry", async () => {
        await blockchainService.getBlockNumber();
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getBlockNumber" });
      });

      it("returns result of the successful RPC call", async () => {
        const result = await blockchainService.getBlockNumber();
        expect(result).toEqual(blockNumber);
      });
    });

    describe("if the call throws a timeout error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getBlockNumber")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(blockNumber);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getBlockNumber();
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });

    describe("if the call throws a connection refused error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getBlockNumber")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(blockNumber);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getBlockNumber();
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });
  });

  describe("getTransaction", () => {
    const transactionHash = "transactionHash";
    const transaction: TransactionResponse = mock<TransactionResponse>({ hash: "transactionHash" });
    let timeoutSpy;

    beforeEach(() => {
      jest.spyOn(provider, "getTransaction").mockResolvedValue(transaction);
      timeoutSpy = jest.spyOn(timersPromises, "setTimeout");
    });

    it("starts the rpc call duration metric", async () => {
      await blockchainService.getTransaction(transactionHash);
      expect(startRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("gets transaction by the specified hash", async () => {
      await blockchainService.getTransaction(transactionHash);
      expect(provider.getTransaction).toHaveBeenCalledTimes(1);
      expect(provider.getTransaction).toHaveBeenCalledWith(transactionHash);
    });

    it("stops the rpc call duration metric", async () => {
      await blockchainService.getTransaction(transactionHash);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getTransaction" });
    });

    it("returns the transaction", async () => {
      const result = await blockchainService.getTransaction(transactionHash);
      expect(result).toEqual(transaction);
    });

    describe("if the call throws an error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getTransaction")
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockResolvedValueOnce(transaction);
      });

      it("retries RPC call with a default timeout", async () => {
        await blockchainService.getTransaction(transactionHash);
        expect(provider.getTransaction).toHaveBeenCalledTimes(3);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, defaultRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, defaultRetryTimeout);
      });

      it("stops the rpc call duration metric only for the successful retry", async () => {
        await blockchainService.getTransaction(transactionHash);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getTransaction" });
      });

      it("returns result of the successful RPC call", async () => {
        const result = await blockchainService.getTransaction(transactionHash);
        expect(result).toEqual(transaction);
      });
    });

    describe("if the call throws a timeout error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getTransaction")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(transaction);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getTransaction(transactionHash);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });

    describe("if the call throws a connection refused error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getTransaction")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(transaction);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getTransaction(transactionHash);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });
  });

  describe("getTransactionReceipt", () => {
    const transactionHash = "transactionHash";
    const transactionReceipt: TransactionReceipt = mock<TransactionReceipt>({
      hash: "initiatorAddress",
    });
    let timeoutSpy;

    beforeEach(() => {
      jest.spyOn(provider, "getTransactionReceipt").mockResolvedValue(transactionReceipt);
      timeoutSpy = jest.spyOn(timersPromises, "setTimeout");
    });

    it("starts the rpc call duration metric", async () => {
      await blockchainService.getTransactionReceipt(transactionHash);
      expect(startRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("gets transaction receipt by the specified hash", async () => {
      await blockchainService.getTransactionReceipt(transactionHash);
      expect(provider.getTransactionReceipt).toHaveBeenCalledTimes(1);
      expect(provider.getTransactionReceipt).toHaveBeenCalledWith(transactionHash);
    });

    it("stops the rpc call duration metric", async () => {
      await blockchainService.getTransactionReceipt(transactionHash);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getTransactionReceipt" });
    });

    it("returns the transaction receipt", async () => {
      const result = await blockchainService.getTransactionReceipt(transactionHash);
      expect(result).toEqual(transactionReceipt);
    });

    describe("if the call throws an error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getTransactionReceipt")
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockResolvedValueOnce(transactionReceipt);
      });

      it("retries RPC call with a default timeout", async () => {
        await blockchainService.getTransactionReceipt(transactionHash);
        expect(provider.getTransactionReceipt).toHaveBeenCalledTimes(3);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, defaultRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, defaultRetryTimeout);
      });

      it("stops the rpc call duration metric only for the successful retry", async () => {
        await blockchainService.getTransactionReceipt(transactionHash);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getTransactionReceipt" });
      });

      it("returns result of the successful RPC call", async () => {
        const result = await blockchainService.getTransactionReceipt(transactionHash);
        expect(result).toEqual(transactionReceipt);
      });
    });

    describe("if the call throws a timeout error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getTransactionReceipt")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(transactionReceipt);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getTransactionReceipt(transactionHash);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });

    describe("if the call throws a connection refused error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getTransactionReceipt")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(transactionReceipt);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getTransactionReceipt(transactionHash);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });
  });

  describe("getLogs", () => {
    const fromBlock = 10;
    const toBlock = 20;
    const logs: Log[] = [mock<Log>({ index: 1 }), mock<Log>({ index: 2 })];
    let timeoutSpy;

    beforeEach(() => {
      jest.spyOn(provider, "getLogs").mockResolvedValue(logs);
      timeoutSpy = jest.spyOn(timersPromises, "setTimeout");
    });

    it("starts the rpc call duration metric", async () => {
      await blockchainService.getLogs({ fromBlock, toBlock });
      expect(startRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("gets logs by the specified from and to block numbers", async () => {
      await blockchainService.getLogs({ fromBlock, toBlock });
      expect(provider.getLogs).toHaveBeenCalledTimes(1);
      expect(provider.getLogs).toHaveBeenCalledWith({ fromBlock, toBlock });
    });

    it("stops the rpc call duration metric", async () => {
      await blockchainService.getLogs({ fromBlock, toBlock });
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getLogs" });
    });

    it("returns the logs", async () => {
      const result = await blockchainService.getLogs({ fromBlock, toBlock });
      expect(result).toEqual(logs);
    });

    describe("if the call throws an error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getLogs")
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockResolvedValueOnce(logs);
      });

      it("retries RPC call with a default timeout", async () => {
        await blockchainService.getLogs({ fromBlock, toBlock });
        expect(provider.getLogs).toHaveBeenCalledTimes(3);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, defaultRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, defaultRetryTimeout);
      });

      it("stops the rpc call duration metric only for the successful retry", async () => {
        await blockchainService.getLogs({ fromBlock, toBlock });
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getLogs" });
      });

      it("returns result of the successful RPC call", async () => {
        const result = await blockchainService.getLogs({ fromBlock, toBlock });
        expect(result).toEqual(logs);
      });
    });

    describe("if the call throws a timeout error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getLogs")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(logs);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getLogs({ fromBlock, toBlock });
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });

    describe("if the call throws a connection refused error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getLogs")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(logs);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getLogs({ fromBlock, toBlock });
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });
  });

  describe("getCode", () => {
    const address = "address";
    const bytecode = "0x0123345";
    let timeoutSpy;

    beforeEach(() => {
      jest.spyOn(provider, "getCode").mockResolvedValue(bytecode);
      timeoutSpy = jest.spyOn(timersPromises, "setTimeout");
    });

    it("starts the rpc call duration metric", async () => {
      await blockchainService.getCode(address);
      expect(startRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("gets bytecode for the specified address", async () => {
      await blockchainService.getCode(address);
      expect(provider.getCode).toHaveBeenCalledTimes(1);
      expect(provider.getCode).toHaveBeenCalledWith(address);
    });

    it("stops the rpc call duration metric", async () => {
      await blockchainService.getCode(address);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getCode" });
    });

    it("returns the bytecode", async () => {
      const result = await blockchainService.getCode(address);
      expect(result).toEqual(bytecode);
    });

    describe("if the call throws an error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getCode")
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockResolvedValueOnce(bytecode);
      });

      it("retries RPC call with a default timeout", async () => {
        await blockchainService.getCode(address);
        expect(provider.getCode).toHaveBeenCalledTimes(3);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, defaultRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, defaultRetryTimeout);
      });

      it("stops the rpc call duration metric only for the successful retry", async () => {
        await blockchainService.getCode(address);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getCode" });
      });

      it("returns result of the successful RPC call", async () => {
        const result = await blockchainService.getCode(address);
        expect(result).toEqual(bytecode);
      });
    });

    describe("if the call throws a timeout error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getCode")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(bytecode);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getCode(address);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });

    describe("if the call throws a connection refused error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "getCode")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(bytecode);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.getCode(address);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });
  });

  describe("on", () => {
    beforeEach(() => {
      provider.on = jest.fn();
    });

    it("subscribes to the new events", () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const handler = () => {};
      blockchainService.on("block", handler);
      expect(provider.on).toHaveBeenCalledTimes(1);
      expect(provider.on).toHaveBeenCalledWith("block", handler);
    });
  });

  describe("getERC20TokenData", () => {
    const contractAddress = "contractAddress";
    const symbol = "symbol";
    const decimals = 18;
    const name = "name";
    let symbolMock: jest.Mock;
    let decimalMock: jest.Mock;
    let nameMock: jest.Mock;

    beforeEach(() => {
      symbolMock = jest.fn().mockResolvedValue(symbol);
      decimalMock = jest.fn().mockResolvedValue(decimals);
      nameMock = jest.fn().mockResolvedValue(name);

      (RetryableContract as any as jest.Mock).mockReturnValue({
        symbol: symbolMock,
        decimals: decimalMock,
        name: nameMock,
      });
    });

    it("uses ERC20 token contract interface", async () => {
      await blockchainService.getERC20TokenData(contractAddress);
      expect(RetryableContract).toHaveBeenCalledTimes(1);
      expect(RetryableContract).toBeCalledWith(contractAddress, new Interface(erc20ABI), provider);
    });

    it("gets contact symbol", async () => {
      await blockchainService.getERC20TokenData(contractAddress);
      expect(symbolMock).toHaveBeenCalledTimes(1);
    });

    it("gets contact decimals", async () => {
      await blockchainService.getERC20TokenData(contractAddress);
      expect(decimalMock).toHaveBeenCalledTimes(1);
    });

    it("gets contact name", async () => {
      await blockchainService.getERC20TokenData(contractAddress);
      expect(nameMock).toHaveBeenCalledTimes(1);
    });

    it("returns token data", async () => {
      const tokenData = await blockchainService.getERC20TokenData(contractAddress);
      expect(tokenData).toEqual({ symbol, decimals, name });
    });

    describe("when contract function throws an error", () => {
      const error = new Error("contract error");

      beforeEach(() => {
        symbolMock = jest.fn().mockImplementation(() => {
          throw error;
        });
        decimalMock = jest.fn().mockResolvedValue(decimals);
        nameMock = jest.fn().mockResolvedValue(name);

        (RetryableContract as any as jest.Mock).mockReturnValue({
          symbol: symbolMock,
          decimals: decimalMock,
          name: nameMock,
        });
      });

      it("throws an error", async () => {
        await expect(blockchainService.getERC20TokenData(contractAddress)).rejects.toThrowError(error);
      });
    });
  });

  describe("getBalance", () => {
    const blockNumber = 5;
    let tokenAddress: string;
    const address = "address";

    beforeEach(() => {
      tokenAddress = "tokenAddress";
    });
    describe("if token address is ETH", () => {
      let timeoutSpy;
      const balance = BigInt(10);

      beforeEach(() => {
        tokenAddress = ZERO_ADDRESS;
        jest.spyOn(provider, "getBalance").mockResolvedValue(BigInt(10));
        timeoutSpy = jest.spyOn(timersPromises, "setTimeout");
      });

      it("starts the rpc call duration metric", async () => {
        await blockchainService.getBalance(address, blockNumber, tokenAddress);
        expect(startRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      it("gets the balance for ETH", async () => {
        await blockchainService.getBalance(address, blockNumber, tokenAddress);
        expect(provider.getBalance).toHaveBeenCalledTimes(1);
        expect(provider.getBalance).toHaveBeenCalledWith(address, blockNumber);
      });

      it("stops the rpc call duration metric", async () => {
        await blockchainService.getBalance(address, blockNumber, tokenAddress);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getBalance" });
      });

      it("returns the address balance for ETH", async () => {
        jest.spyOn(provider, "getBalance").mockResolvedValueOnce(BigInt(15));

        const balance = await blockchainService.getBalance(address, blockNumber, tokenAddress);
        expect(balance).toStrictEqual(balance);
      });

      describe("if the call throws an error", () => {
        const error = new Error("RPC call error");
        beforeEach(() => {
          jest
            .spyOn(provider, "getBalance")
            .mockRejectedValueOnce(error)
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(balance);
        });

        it("retries RPC call with a default timeout", async () => {
          await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(provider.getBalance).toHaveBeenCalledTimes(3);
          expect(timeoutSpy).toHaveBeenCalledTimes(2);
          expect(timeoutSpy).toHaveBeenNthCalledWith(1, defaultRetryTimeout);
          expect(timeoutSpy).toHaveBeenNthCalledWith(2, defaultRetryTimeout);
        });

        it("stops the rpc call duration metric only for the successful retry", async () => {
          await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
          expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "getBalance" });
        });

        it("returns result of the successful RPC call", async () => {
          const result = await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(result).toEqual(balance);
        });
      });

      describe("if the call throws a timeout error", () => {
        const error = new Error();
        (error as any).code = "TIMEOUT";
        beforeEach(() => {
          jest
            .spyOn(provider, "getBalance")
            .mockRejectedValueOnce(error)
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(balance);
        });

        it("retries RPC call with a quick timeout", async () => {
          await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(timeoutSpy).toHaveBeenCalledTimes(2);
          expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
          expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
        });
      });

      describe("if the call throws a connection refused error", () => {
        const error = new Error();
        (error as any).code = "ECONNREFUSED";
        beforeEach(() => {
          jest
            .spyOn(provider, "getBalance")
            .mockRejectedValueOnce(error)
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(balance);
        });

        it("retries RPC call with a quick timeout", async () => {
          await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(timeoutSpy).toHaveBeenCalledTimes(2);
          expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
          expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
        });
      });

      describe("if the call throws a connection reset error", () => {
        const error = new Error();
        (error as any).code = "ECONNRESET";
        beforeEach(() => {
          jest
            .spyOn(provider, "getBalance")
            .mockRejectedValueOnce(error)
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(balance);
        });

        it("retries RPC call with a quick timeout", async () => {
          await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(timeoutSpy).toHaveBeenCalledTimes(2);
          expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
          expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
        });
      });

      describe("if the call throws a network error", () => {
        const error = new Error();
        (error as any).code = "NETWORK_ERROR";
        beforeEach(() => {
          jest
            .spyOn(provider, "getBalance")
            .mockRejectedValueOnce(error)
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(balance);
        });

        it("retries RPC call with a quick timeout", async () => {
          await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(timeoutSpy).toHaveBeenCalledTimes(2);
          expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
          expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
        });
      });
    });

    describe("if token address is not ETH", () => {
      beforeEach(() => {
        tokenAddress = "0x22b44df5aa1ee4542b6318ff971f183135f5e4ce";
      });

      describe("if ERC20 Contract function throws an exception", () => {
        const error = new Error("Ethers Contract error");

        beforeEach(() => {
          (RetryableContract as any as jest.Mock).mockReturnValueOnce(
            mock<RetryableContract>({
              balanceOf: jest.fn().mockImplementationOnce(() => {
                throw error;
              }) as any,
            })
          );
        });

        it("throws an error", async () => {
          await expect(blockchainService.getBalance(address, blockNumber, tokenAddress)).rejects.toThrowError(error);
        });
      });

      describe("when there is a token with the specified address", () => {
        let balanceOfMock: jest.Mock;

        beforeEach(() => {
          balanceOfMock = jest.fn().mockResolvedValueOnce(BigInt(20));
          (RetryableContract as any as jest.Mock).mockReturnValueOnce(
            mock<RetryableContract>({
              balanceOf: balanceOfMock as any,
            })
          );
        });

        it("uses the proper token contract", async () => {
          await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(RetryableContract).toHaveBeenCalledTimes(1);
          expect(RetryableContract).toBeCalledWith(tokenAddress, new Interface(erc20ABI), provider);
        });

        it("gets the balance for the specified address and block", async () => {
          await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(balanceOfMock).toHaveBeenCalledTimes(1);
          expect(balanceOfMock).toHaveBeenCalledWith(address, { blockTag: blockNumber });
        });

        it("returns the balance of the token", async () => {
          const balance = await blockchainService.getBalance(address, blockNumber, tokenAddress);
          expect(balance).toStrictEqual(BigInt(20));
        });
      });
    });
  });

  describe("debugTraceTransaction", () => {
    const traceTransactionResult = {
      type: "Call",
      from: "0x0000000000000000000000000000000000000000",
      to: "0x0000000000000000000000000000000000008001",
      error: null,
      revertReason: "Exceed daily limit",
    };
    let timeoutSpy;

    beforeEach(() => {
      jest.spyOn(provider, "send").mockResolvedValue(traceTransactionResult);
      timeoutSpy = jest.spyOn(timersPromises, "setTimeout");
    });

    it("starts the rpc call duration metric", async () => {
      await blockchainService.debugTraceTransaction(
        "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b"
      );
      expect(startRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("gets transaction trace", async () => {
      await blockchainService.debugTraceTransaction(
        "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b"
      );
      expect(provider.send).toHaveBeenCalledTimes(1);
      expect(provider.send).toHaveBeenCalledWith("debug_traceTransaction", [
        "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b",
        {
          tracer: "callTracer",
          tracerConfig: { onlyTopCall: false },
        },
      ]);
    });

    it("gets transaction trace with only top call", async () => {
      await blockchainService.debugTraceTransaction(
        "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b",
        true
      );
      expect(provider.send).toHaveBeenCalledTimes(1);
      expect(provider.send).toHaveBeenCalledWith("debug_traceTransaction", [
        "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b",
        {
          tracer: "callTracer",
          tracerConfig: { onlyTopCall: true },
        },
      ]);
    });

    it("stops the rpc call duration metric", async () => {
      await blockchainService.debugTraceTransaction(
        "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b"
      );
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
      expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "debugTraceTransaction" });
    });

    it("returns transaction trace", async () => {
      const result = await blockchainService.debugTraceTransaction(
        "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b"
      );
      expect(result).toEqual(traceTransactionResult);
    });

    describe("if the call throws an error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "send")
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockRejectedValueOnce(new Error("RPC call error"))
          .mockResolvedValueOnce(traceTransactionResult);
      });

      it("retries RPC call with a default timeout", async () => {
        await blockchainService.debugTraceTransaction(
          "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b"
        );
        expect(provider.send).toHaveBeenCalledTimes(3);
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, defaultRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, defaultRetryTimeout);
      });

      it("stops the rpc call duration metric only for the successful retry", async () => {
        await blockchainService.debugTraceTransaction(
          "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b"
        );
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledTimes(1);
        expect(stopRpcCallDurationMetricMock).toHaveBeenCalledWith({ function: "debugTraceTransaction" });
      });

      it("returns result of the successful RPC call", async () => {
        const result = await blockchainService.debugTraceTransaction(
          "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b"
        );
        expect(result).toEqual(traceTransactionResult);
      });
    });

    describe("if the call throws a timeout error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "send")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(traceTransactionResult);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.debugTraceTransaction(
          "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b"
        );
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });

    describe("if the call throws a connection refused error", () => {
      beforeEach(() => {
        jest
          .spyOn(provider, "send")
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockRejectedValueOnce({ code: "TIMEOUT" })
          .mockResolvedValueOnce(traceTransactionResult);
      });

      it("retries RPC call with a quick timeout", async () => {
        await blockchainService.debugTraceTransaction(
          "0xc0ae49e96910fa9df22eb59c0977905864664d495bc95906120695aa26e1710b"
        );
        expect(timeoutSpy).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenNthCalledWith(1, quickRetryTimeout);
        expect(timeoutSpy).toHaveBeenNthCalledWith(2, quickRetryTimeout);
      });
    });
  });
});
