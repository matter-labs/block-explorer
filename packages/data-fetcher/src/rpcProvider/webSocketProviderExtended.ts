import { Logger } from "@nestjs/common";
import { providers } from "ethers";
import { ProviderState } from "./jsonRpcProviderBase";

const expectedPongBack = 15000;
const checkInterval = 7000;

export class WebSocketProviderExtended extends providers.WebSocketProvider {
  private readonly logger: Logger;
  private state: ProviderState = "connecting";

  constructor(providerUrl) {
    super(providerUrl);
    this.attachStateCheck();
    this.logger = new Logger(WebSocketProviderExtended.name);
  }

  private attachStateCheck(): void {
    let pingTimeout: NodeJS.Timeout;
    let keepAliveInterval: NodeJS.Timeout;

    this._websocket.on("open", () => {
      this.state = "open";

      this.logger.debug("Web socket has been opened");

      keepAliveInterval = setInterval(() => {
        this._websocket.ping();

        pingTimeout = setTimeout(() => {
          this.logger.error(
            "No response for the ping request. Web socket connection will be terminated.",
            "Web socket error"
          );
          this._websocket.terminate();
        }, expectedPongBack);
      }, checkInterval);
    });

    this._websocket.on("close", () => {
      this.state = "closed";

      this.logger.debug("Web socket has been closed");

      if (keepAliveInterval) clearInterval(keepAliveInterval);
      if (pingTimeout) clearTimeout(pingTimeout);
    });

    this._websocket.on("pong", () => {
      if (pingTimeout) clearInterval(pingTimeout);
    });
  }

  public getState(): ProviderState {
    return this.state;
  }
}
