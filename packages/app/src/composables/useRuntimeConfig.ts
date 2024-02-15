import type { NetworkConfig, RuntimeConfig } from "@/configs";

export const DEFAULT_NETWORK: NetworkConfig = {
  apiUrl: "https://block-explorer-api.testnets.zksync.dev",
  verificationApiUrl: "https://zksync2-testnet-explorer.zksync.dev",
  bridgeUrl: "https://portal.zksync.io/bridge/?network=goerli",
  hostnames: ["https://goerli.explorer.zksync.io"],
  icon: "/images/icons/zksync-arrows.svg",
  l1ExplorerUrl: "https://goerli.etherscan.io",
  l2ChainId: 280,
  l2NetworkName: "zkSync Era Goerli Testnet",
  maintenance: false,
  name: "goerli",
  published: true,
  rpcUrl: "https://testnet.era.zksync.dev",
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
