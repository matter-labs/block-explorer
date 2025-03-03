import { Provider } from "zksync-ethers";

export type ProviderState = "connecting" | "open" | "closed";

export abstract class JsonRpcProviderBase extends Provider {
  public abstract getState(): ProviderState;
}
