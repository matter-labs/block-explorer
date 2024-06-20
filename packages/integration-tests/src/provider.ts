import { ethers } from "ethers";
import { Provider } from "zksync-web3";

import type { BaseProvider } from "@ethersproject/providers/src.ts/base-provider";

const providerCacheL1: { [key: string]: BaseProvider } = {};
const providerCacheL2: { [key: string]: Provider } = {};

export function getProviderForL2(network: string): Provider {
  if (!providerCacheL2[network]) {
    providerCacheL2[network] = new Provider(network);
  }
  return providerCacheL2[network];
}

export function getProviderForL1(network: string): BaseProvider {
  if (!providerCacheL1[network]) {
    providerCacheL1[network] = ethers.getDefaultProvider(network);
  }
  return providerCacheL1[network];
}
