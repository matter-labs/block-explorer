import { Injectable, Logger } from "@nestjs/common";
import { Histogram } from "prom-client";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Listener, toBeHex } from "ethers";
import { ConfigService } from "@nestjs/config";
import { setTimeout } from "timers/promises";
import {
  ProviderEvent,
  type Block,
  type BlockTag,
  type TransactionReceipt,
  type TransactionResponse,
  type Log,
} from "ethers";
import { JsonRpcProviderBase } from "../rpcProvider";
import { BLOCKCHAIN_RPC_CALL_DURATION_METRIC_NAME, BlockchainRpcCallMetricLabel } from "../metrics";
import { RetryableContract } from "./retryableContract";
import { L2_NATIVE_TOKEN_VAULT_ADDRESS, L2_ACCOUNT_CODE_STORAGE_ADDRESS, CONTRACT_INTERFACES } from "../constants";
import isBaseToken from "../utils/isBaseToken";

export interface TransactionTrace {
  type: string;
  from: string;
  to: string;
  error: string | null;
  revertReason: string | null;
  calls: TransactionTrace[] | null;
  value: string;
  input: string;
}

export interface TraceResult {
  txHash: string;
  result: TransactionTrace | null;
  error: string | null;
}

@Injectable()
export class BlockchainService {
  private readonly logger: Logger;
  private readonly rpcCallsDefaultRetryTimeout: number;
  private readonly rpcCallsQuickRetryTimeout: number;
  private readonly rpcCallRetriesMaxTotalTimeout: number;
  private readonly errorCodesForQuickRetry: string[] = ["NETWORK_ERROR", "ECONNRESET", "ECONNREFUSED", "TIMEOUT"];

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
      this.logger.error({ message: error.message, code: error.code, function: functionName }, error.stack);
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

  public async debugTraceBlock(blockNumber: number, onlyTopCall = false): Promise<TraceResult[]> {
    return await this.rpcCall(async () => {
      return await this.provider.send("debug_traceBlockByNumber", [
        toBeHex(blockNumber),
        {
          tracer: "callTracer",
          tracerConfig: { onlyTopCall },
        },
      ]);
    }, "debugTraceBlock");
  }

  public async on(eventName: ProviderEvent, listener: Listener): Promise<void> {
    this.provider.on(eventName, listener);
  }

  public async getERC20TokenData(contractAddress: string): Promise<{ symbol: string; decimals: number; name: string }> {
    const erc20Contract = new RetryableContract(contractAddress, CONTRACT_INTERFACES.ERC20.interface, this.provider);
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

  public async getTokenAddressByAssetId(assetId: string): Promise<string> {
    const vaultContract = new RetryableContract(
      L2_NATIVE_TOKEN_VAULT_ADDRESS,
      CONTRACT_INTERFACES.L2_NATIVE_TOKEN_VAULT.interface,
      this.provider
    );
    const tokenAddress = await vaultContract.tokenAddress(assetId);
    return tokenAddress;
  }

  public async getRawCodeHash(address: string): Promise<string> {
    const accountCodeStorageContract = new RetryableContract(
      L2_ACCOUNT_CODE_STORAGE_ADDRESS,
      CONTRACT_INTERFACES.L2_ACCOUNT_CODE_STORAGE.interface,
      this.provider
    );
    const bytecodeHash = await accountCodeStorageContract.getRawCodeHash(address);
    return bytecodeHash;
  }

  public async getBalance(address: string, blockNumber: number, tokenAddress: string): Promise<bigint> {
    if (isBaseToken(tokenAddress)) {
      return await this.rpcCall(async () => {
        return await this.provider.getBalance(address, blockNumber);
      }, "getBalance");
    }

    const erc20Contract = new RetryableContract(tokenAddress, CONTRACT_INTERFACES.ERC20.interface, this.provider);
    return await erc20Contract.balanceOf(address, { blockTag: blockNumber });
  }
}
