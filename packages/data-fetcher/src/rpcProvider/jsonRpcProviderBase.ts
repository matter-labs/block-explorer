import { JsonRpcProvider } from "ethers";

export type ProviderState = "connecting" | "open" | "closed";

export abstract class JsonRpcProviderBase extends JsonRpcProvider {
  public abstract getState(): ProviderState;
}
