import { ethers } from "ethers";
import { Provider } from "zksync-web3";

import type { AbstractProvider } from "ethers";

const providerCacheL1: { [key: string]: AbstractProvider } = {};
const providerCacheL2: { [key: string]: Provider } = {};

export function getProviderForL2(network: string): Provider {
  if (!providerCacheL2[network]) {
    providerCacheL2[network] = new Provider(network);
  }
  return providerCacheL2[network];
}

export function getProviderForL1(network: string): AbstractProvider {
  if (!providerCacheL1[network]) {
    providerCacheL1[network] = ethers.getDefaultProvider(network);
  }
  return providerCacheL1[network];
}
