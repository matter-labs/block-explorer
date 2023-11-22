import type { NetworkConfig, RuntimeConfig } from "@/configs";

export const DEFAULT_NETWORK: NetworkConfig = {
  apiUrl: "https://block-explorer-api.testnets.zksync.dev",
  verificationApiUrl: "https://zksync2-testnet-explorer.zksync.dev",
  bridgeUrl: "https://goerli.bridge.zksync.io",
  hostnames: ["https://goerli.explorer.zksync.io"],
  icon: "/images/icons/zksync-arrows.svg",
  l1ExplorerUrl: "https://goerli.etherscan.io",
  l2ChainId: 280,
  l2NetworkName: "zkSync Era Testnet",
  l2WalletUrl: "https://goerli.portal.zksync.io/",
  maintenance: false,
  name: "goerli",
  newProverUrl: "https://storage.googleapis.com/zksync-era-testnet-proofs/proofs_fri",
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
