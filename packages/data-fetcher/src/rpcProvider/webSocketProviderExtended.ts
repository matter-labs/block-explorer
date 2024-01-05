import { providers } from "ethers";
import logger from "../logger";
import { ProviderState } from "./jsonRpcProviderBase";

const expectedPongBack = 10000;
const checkInterval = 12000;
const pendingRequestsLimit = 100000;

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class WebSocketProviderExtended extends providers.WebSocketProvider {
  private state: ProviderState = "connecting";
  private readonly connectionQuickTimeout: number;
  private readonly connectionTimeout: number;

  constructor(providerUrl, connectionTimeout: number, connectionQuickTimeout: number) {
    super(providerUrl);
    this.connectionTimeout = connectionTimeout;
    this.connectionQuickTimeout = connectionQuickTimeout;
    this.attachStateCheck();
  }

  public override async send(method: string, params: Array<any>): Promise<any> {
    const quickTimeout = this.startTimeout(this.connectionQuickTimeout, "WS RPC provider: quick timeout");
    try {
      return await Promise.race([quickTimeout.promise, super.send(method, params)]);
    } catch (e) {
      if (e instanceof TimeoutError) {
        logger.error({
          message: e.message,
          stack: e.stack,
          method,
          params,
          timeout: this.connectionQuickTimeout,
          context: WebSocketProviderExtended.name,
        });

        const timeout = this.startTimeout(this.connectionTimeout, "WS RPC provider: timeout");
        try {
          return await Promise.race([timeout.promise, super.send(method, params)]);
        } finally {
          timeout.cancel();
        }
      }
      throw e;
    } finally {
      quickTimeout.cancel();
    }
  }

  private startTimeout(timeout: number, errorMessage = "WS RPC provider: timeout") {
    let timer: NodeJS.Timer = null;
    const promise = new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        timer ? reject(new TimeoutError(errorMessage)) : resolve(undefined);
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

  private attachStateCheck(): void {
    let pingTimeout: NodeJS.Timeout;
    let keepAliveInterval: NodeJS.Timeout;

    this._websocket.on("open", () => {
      this.state = "open";

      logger.debug("Web socket has been opened");

      keepAliveInterval = setInterval(() => {
        this._websocket.ping();
        pingTimeout = setTimeout(() => {
          logger.error({
            message: "No response for the ping request. Web socket connection will be terminated",
            context: WebSocketProviderExtended.name,
          });
          this._websocket.terminate();
        }, expectedPongBack);

        if (Object.keys(this._requests).length > pendingRequestsLimit) {
          logger.error({
            message: "Too many pending requests. Web socket connection will be terminated",
            context: WebSocketProviderExtended.name,
          });
          this._websocket.terminate();
          return;
        }
      }, checkInterval);
    });

    this._websocket.on("close", () => {
      this.state = "closed";

      logger.debug("Web socket has been closed");

      if (keepAliveInterval) clearInterval(keepAliveInterval);
      if (pingTimeout) clearTimeout(pingTimeout);
    });

    this._websocket.on("pong", () => {
      if (pingTimeout) clearTimeout(pingTimeout);
    });
  }

  public getState(): ProviderState {
    return this.state;
  }
}
