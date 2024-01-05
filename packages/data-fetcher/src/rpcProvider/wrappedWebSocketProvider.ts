import { ProviderState } from "./jsonRpcProviderBase";
import { WebSocketProviderExtended } from "./webSocketProviderExtended";

const monitorInterval = 10000;

export class WrappedWebSocketProvider {
  private readonly providerUrl: string;
  private readonly connectionTimeout: number;
  private readonly connectionQuickTimeout: number;
  private instances: WebSocketProviderExtended[] = [];

  constructor(providerUrl: string, connectionTimeout: number, connectionQuickTimeout: number, maxConnections = 5) {
    this.providerUrl = providerUrl;
    this.connectionTimeout = connectionTimeout;
    this.connectionQuickTimeout = connectionQuickTimeout;

    for (let i = 0; i < maxConnections; i++) {
      this.instances[i] = new WebSocketProviderExtended(
        this.providerUrl,
        this.connectionTimeout,
        this.connectionQuickTimeout
      );
    }
    this.monitorInstances();
  }

  public getProvider(): WebSocketProviderExtended {
    const totalActiveInstances = this.instances.filter((instance) => instance.getState() !== "closed");
    const randomInstanceNumber = Math.floor(Math.random() * totalActiveInstances.length);
    return this.instances[randomInstanceNumber];
  }

  private monitorInstances(): void {
    setInterval(() => {
      for (let i = 0; i < this.instances.length; i++) {
        if (this.instances[i].getState() === "closed") {
          this.instances[i] = new WebSocketProviderExtended(
            this.providerUrl,
            this.connectionTimeout,
            this.connectionQuickTimeout
          );
        }
      }
    }, monitorInterval);
  }

  public getState(): ProviderState {
    if (this.instances.find((instance) => instance.getState() === "open")) {
      return "open";
    }
    if (this.instances.find((instance) => instance.getState() === "connecting")) {
      return "connecting";
    }
    return "closed";
  }
}
