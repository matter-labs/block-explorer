import { Provider } from "zksync-web3";

export type ProviderState = "connecting" | "open" | "closed";

export abstract class JsonRpcProviderBase extends Provider {
  public abstract getState(): ProviderState;
}
