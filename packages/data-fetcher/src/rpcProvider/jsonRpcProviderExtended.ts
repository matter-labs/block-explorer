import { Provider } from "zksync-web3";
import { ProviderState, JsonRpcProviderBase } from "./jsonRpcProviderBase";
import logger from "../logger";

export class QuickTimeoutError extends Error {
  constructor() {
    super();
  }
}

export class JsonRpcProviderExtended extends Provider implements JsonRpcProviderBase {
  private readonly connectionQuickTimeout;
  constructor(providerUrl: string, connectionTimeout: number, connectionQuickTimeout: number) {
    super({
      url: providerUrl,
      timeout: connectionTimeout,
    });
    this.connectionQuickTimeout = connectionQuickTimeout;
  }

  private startQuickTimeout(timeout) {
    let timer: NodeJS.Timer = null;
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
    const quickTimeout = this.startQuickTimeout(this.connectionQuickTimeout);
    try {
      return await Promise.race([quickTimeout.promise, super.send(method, params)]);
    } catch (e) {
      if (e instanceof QuickTimeoutError) {
        logger.error({
          message: "RPC provider: quick timeout",
          stack: e.stack,
          method,
          params,
          timeout: this.connectionQuickTimeout,
          context: JsonRpcProviderExtended.name,
        });
        return super.send(method, params);
      }
      throw e;
    } finally {
      quickTimeout.cancel();
    }
  }
}
