import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { utils, types } from "zksync-ethers";
import { Histogram } from "prom-client";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Listener } from "ethers";
import { ConfigService } from "@nestjs/config";
import { setTimeout } from "timers/promises";
import { ProviderEvent } from "ethers";
import { JsonRpcProviderBase } from "../rpcProvider";
import { BLOCKCHAIN_RPC_CALL_DURATION_METRIC_NAME, BlockchainRpcCallMetricLabel } from "../metrics";
import { RetryableContract } from "./retryableContract";

export interface BridgeAddresses {
  l2Erc20DefaultBridge?: string;
}

export interface TraceTransactionResult {
  type: string;
  from: string;
  to: string;
  error: string | null;
  revertReason: string | null;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger: Logger;
  private readonly rpcCallsDefaultRetryTimeout: number;
  private readonly rpcCallsQuickRetryTimeout: number;
  private readonly rpcCallRetriesMaxTotalTimeout: number;
  private readonly errorCodesForQuickRetry: string[] = ["NETWORK_ERROR", "ECONNRESET", "ECONNREFUSED", "TIMEOUT"];
  public bridgeAddresses: BridgeAddresses;

  public constructor(
    configService: ConfigService,
    private readonly provider: JsonRpcProviderBase,
    @InjectMetric(BLOCKCHAIN_RPC_CALL_DURATION_METRIC_NAME)
    private readonly rpcCallDurationMetric: Histogram<BlockchainRpcCallMetricLabel>
  ) {
    this.logger = new Logger(BlockchainService.name);
    this.rpcCallsDefaultRetryTimeout = configService.get<number>("blockchain.rpcCallDefaultRetryTimeout");
    this.rpcCallsQuickRetryTimeout = configService.get<number>("blockchain.rpcCallQuickRetryTimeout");
    this.rpcCallRetriesMaxTotalTimeout = configService.get<number>("blockchain.rpcCallRetriesMaxTotalTimeout");
  }

  private async rpcCall<T>(action: () => Promise<T>, functionName: string, retriesTotalTimeAwaited = 0): Promise<T> {
    const stopDurationMeasuring = this.rpcCallDurationMetric.startTimer();
    try {
      const result = await action();
      stopDurationMeasuring({ function: functionName });
      return result;
    } catch (error) {
      this.logger.error({ message: error.message, code: error.code }, error.stack);
      const retryTimeout = this.errorCodesForQuickRetry.includes(error.code)
        ? this.rpcCallsQuickRetryTimeout
        : this.rpcCallsDefaultRetryTimeout;

      const totalTimeAwaited = retriesTotalTimeAwaited + retryTimeout;
      if (totalTimeAwaited > this.rpcCallRetriesMaxTotalTimeout) {
        this.logger.error({ message: "Exceeded retries total timeout, failing the request", functionName });
        throw error;
      }

      await setTimeout(retryTimeout);
      return this.rpcCall(action, functionName, totalTimeAwaited);
    }
  }

  public async getL1BatchNumber(): Promise<number> {
    return await this.rpcCall(async () => {
      return await this.provider.getL1BatchNumber();
    }, "getL1BatchNumber");
  }

  public async getL1BatchDetails(batchNumber: number): Promise<types.BatchDetails> {
    return await this.rpcCall(async () => {
      const batchDetails = await this.provider.getL1BatchDetails(batchNumber);
      if (batchDetails && batchNumber === 0) {
        batchDetails.committedAt = batchDetails.provenAt = batchDetails.executedAt = new Date(0);
      }
      return batchDetails;
    }, "getL1BatchDetails");
  }

  public async getBlock(blockHashOrBlockTag: types.BlockTag): Promise<types.Block> {
    return await this.rpcCall(async () => {
      return await this.provider.getBlock(blockHashOrBlockTag);
    }, "getBlock");
  }

  public async getBlockNumber(): Promise<number> {
    return await this.rpcCall(async () => {
      return await this.provider.getBlockNumber();
    }, "getBlockNumber");
  }

  public async getBlockDetails(blockNumber: number): Promise<types.BlockDetails> {
    return await this.rpcCall(async () => {
      return await this.provider.getBlockDetails(blockNumber);
    }, "getBlockDetails");
  }

  public async getTransaction(transactionHash: string): Promise<types.TransactionResponse> {
    return await this.rpcCall(async () => {
      return await this.provider.getTransaction(transactionHash);
    }, "getTransaction");
  }

  public async getTransactionDetails(transactionHash: string): Promise<types.TransactionDetails> {
    return await this.rpcCall(async () => {
      return await this.provider.getTransactionDetails(transactionHash);
    }, "getTransactionDetails");
  }

  public async getTransactionReceipt(transactionHash: string): Promise<types.TransactionReceipt> {
    return await this.rpcCall(async () => {
      return await this.provider.getTransactionReceipt(transactionHash);
    }, "getTransactionReceipt");
  }

  public async getLogs(eventFilter: { fromBlock: number; toBlock: number }): Promise<types.Log[]> {
    return await this.rpcCall(async () => {
      return await this.provider.getLogs(eventFilter);
    }, "getLogs");
  }

  public async getCode(address: string): Promise<string> {
    return await this.rpcCall(async () => {
      return await this.provider.getCode(address);
    }, "getCode");
  }

  public async getDefaultBridgeAddresses(): Promise<{ erc20L1: string; erc20L2: string }> {
    return await this.rpcCall(async () => {
      return await this.provider.getDefaultBridgeAddresses();
    }, "getDefaultBridgeAddresses");
  }

  public async debugTraceTransaction(txHash: string, onlyTopCall = false): Promise<TraceTransactionResult> {
    return await this.rpcCall(async () => {
      return await this.provider.send("debug_traceTransaction", [
        txHash,
        {
          tracer: "callTracer",
          tracerConfig: { onlyTopCall },
        },
      ]);
    }, "debugTraceTransaction");
  }

  public async on(eventName: ProviderEvent, listener: Listener): Promise<void> {
    this.provider.on(eventName, listener);
  }

  public async getERC20TokenData(contractAddress: string): Promise<{ symbol: string; decimals: number; name: string }> {
    const erc20Contract = new RetryableContract(contractAddress, utils.IERC20, this.provider);
    const [symbol, decimals, name] = await Promise.all([
      erc20Contract.symbol(),
      erc20Contract.decimals(),
      erc20Contract.name(),
    ]);
    return {
      symbol,
      decimals,
      name,
    };
  }

  public async getBalance(address: string, blockNumber: number, tokenAddress: string): Promise<bigint> {
    if (utils.isETH(tokenAddress)) {
      return await this.rpcCall(async () => {
        return await this.provider.getBalance(address, blockNumber);
      }, "getBalance");
    }

    const erc20Contract = new RetryableContract(tokenAddress, utils.IERC20, this.provider);
    return await erc20Contract.balanceOf(address, { blockTag: blockNumber });
  }

  public async onModuleInit(): Promise<void> {
    const bridgeAddresses = await this.getDefaultBridgeAddresses();

    this.bridgeAddresses = {
      l2Erc20DefaultBridge: bridgeAddresses.erc20L2?.toLowerCase(),
    };
    this.logger.debug(`L2 ERC20 Bridge is set to: ${this.bridgeAddresses.l2Erc20DefaultBridge}`);
  }
}
