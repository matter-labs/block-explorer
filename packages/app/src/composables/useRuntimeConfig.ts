import type { NetworkConfig, RuntimeConfig } from "@/configs";

import { checksumAddress } from "@/utils/formatters";
export const DEFAULT_NETWORK: NetworkConfig = {
  groupId: "era",
  apiUrl: "https://block-explorer-api.sepolia.zksync.dev",
  verificationApiUrl: "https://explorer.sepolia.era.zksync.dev",
  bridgeUrl: "https://portal.zksync.io/bridge/?network=sepolia",
  hostnames: ["https://sepolia.explorer.zksync.io"],
  icon: "/images/icons/sophon.svg",
  l1ExplorerUrl: "https://sepolia.etherscan.io",
  l2ChainId: 300,
  l2NetworkName: "ZKsync Era Sepolia Testnet",
  maintenance: false,
  name: "sepolia",
  published: true,
  rpcUrl: "https://sepolia.era.zksync.dev",
  baseTokenAddress: checksumAddress("0x000000000000000000000000000000000000800A"),
};

export default (): RuntimeConfig => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const runtimeConfig = window && window["##runtimeConfig"];

  return {
    version: import.meta.env?.VITE_VERSION || "localhost",
    sentryDSN: runtimeConfig?.sentryDSN || import.meta.env?.VITE_SENTRY_DSN,
    appEnvironment: runtimeConfig?.appEnvironment || import.meta.env?.VITE_APP_ENVIRONMENT || "default",
    environmentConfig: runtimeConfig?.environmentConfig,
  };
};
