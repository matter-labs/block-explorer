import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { utils } from "zksync-ethers";
import { Histogram } from "prom-client";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Listener } from "ethers";
import {
  ProviderEvent,
  type Block,
  type TransactionReceipt,
  type TransactionResponse,
  type Log,
  type BlockTag,
} from "ethers";
import { ConfigService } from "@nestjs/config";
import { setTimeout } from "timers/promises";
import { JsonRpcProviderBase } from "../rpcProvider";
import { BLOCKCHAIN_RPC_CALL_DURATION_METRIC_NAME, BlockchainRpcCallMetricLabel } from "../metrics";
import { RetryableContract } from "./retryableContract";

export interface BridgeAddresses {
  l2Erc20DefaultBridge?: string;
}

export interface TransactionTrace {
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
  }

  private async rpcCall<T>(action: () => Promise<T>, functionName: string): Promise<T> {
    const stopDurationMeasuring = this.rpcCallDurationMetric.startTimer();
    try {
      const result = await action();
      stopDurationMeasuring({ function: functionName });
      return result;
    } catch (error) {
      this.logger.error({ message: error.message, code: error.code, function: functionName }, error.stack);
      if (this.errorCodesForQuickRetry.includes(error.code)) {
        await setTimeout(this.rpcCallsQuickRetryTimeout);
      } else {
        await setTimeout(this.rpcCallsDefaultRetryTimeout);
      }
    }
    return this.rpcCall(action, functionName);
  }

  public async getBlock(blockHashOrBlockTag: BlockTag): Promise<Block> {
    return await this.rpcCall(async () => {
      return await this.provider.getBlock(blockHashOrBlockTag);
    }, "getBlock");
  }

  public async getBlockNumber(): Promise<number> {
    return await this.rpcCall(async () => {
      return await this.provider.getBlockNumber();
    }, "getBlockNumber");
  }

  public async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    return await this.rpcCall(async () => {
      return await this.provider.getTransaction(transactionHash);
    }, "getTransaction");
  }

  public async getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt> {
    return await this.rpcCall(async () => {
      return await this.provider.getTransactionReceipt(transactionHash);
    }, "getTransactionReceipt");
  }

  public async getLogs(eventFilter: { fromBlock: number; toBlock: number }): Promise<Log[]> {
    return await this.rpcCall(async () => {
      return await this.provider.getLogs(eventFilter);
    }, "getLogs");
  }

  public async getCode(address: string): Promise<string> {
    return await this.rpcCall(async () => {
      return await this.provider.getCode(address);
    }, "getCode");
  }

  public async debugTraceTransaction(txHash: string, onlyTopCall = false): Promise<TransactionTrace> {
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
    //const bridgeAddresses = await this.getDefaultBridgeAddresses();
    this.bridgeAddresses = {
      // TODO: figure out how bridging works in ZKsync OS
      l2Erc20DefaultBridge: "", //bridgeAddresses.erc20L2?.toLowerCase(),
    };
    this.logger.debug(`L2 ERC20 Bridge is set to: ${this.bridgeAddresses.l2Erc20DefaultBridge}`);
  }
}
