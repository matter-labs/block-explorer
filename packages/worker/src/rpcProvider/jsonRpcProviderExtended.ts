import { FetchRequest, JsonRpcProvider } from "ethers";
import { ProviderState, JsonRpcProviderBase } from "./jsonRpcProviderBase";
import logger from "../logger";

export class QuickTimeoutError extends Error {
  constructor() {
    super();
  }
}

export class JsonRpcProviderExtended extends JsonRpcProvider implements JsonRpcProviderBase {
  private readonly connectionQuickTimeout;
  private readonly callsFromAddress?: string;
  constructor(
    providerUrl: string,
    connectionTimeout: number,
    connectionQuickTimeout: number,
    batchMaxCount: number,
    batchMaxSizeBytes: number,
    batchStallTimeMs: number,
    callsFromAddress?: string
  ) {
    const fetchRequest = new FetchRequest(providerUrl);
    fetchRequest.timeout = connectionTimeout;

    super(fetchRequest, undefined, {
      batchMaxSize: batchMaxSizeBytes,
      batchMaxCount: batchMaxCount,
      staticNetwork: true,
      batchStallTime: batchStallTimeMs,
    });

    this.connectionQuickTimeout = connectionQuickTimeout;
    this.callsFromAddress = callsFromAddress;
  }

  // eth_call requests without a from address are sent from the configured address, if any
  private addCallsFromAddress(method: string, params: Array<any>): Array<any> {
    if (method !== "eth_call" || !this.callsFromAddress || !params?.[0] || params[0].from) {
      return params;
    }
    return [{ ...params[0], from: this.callsFromAddress }, ...params.slice(1)];
  }

  private startQuickTimeout(timeout) {
    let timer: NodeJS.Timeout = null;
    const promise = new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        timer ? reject(new QuickTimeoutError()) : resolve(undefined);
      }, timeout);
    });

    const cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    return { promise, cancel };
  }

  public getState(): ProviderState {
    return "open";
  }

  public override async send(method: string, params: Array<any>): Promise<any> {
    const requestParams = this.addCallsFromAddress(method, params);
    const quickTimeout = this.startQuickTimeout(this.connectionQuickTimeout);
    try {
      return await Promise.race([quickTimeout.promise, super.send(method, requestParams)]);
    } catch (e) {
      if (e instanceof QuickTimeoutError) {
        logger.error({
          message: "RPC provider: quick timeout",
          stack: e.stack,
          method,
          params: requestParams,
          timeout: this.connectionQuickTimeout,
          context: JsonRpcProviderExtended.name,
        });
        return super.send(method, requestParams);
      }
      throw e;
    } finally {
      quickTimeout.cancel();
    }
  }
}
