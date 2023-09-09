import stagingConfig from "./staging.config";

import type { EnvironmentConfig } from ".";

const config: EnvironmentConfig = {
  networks: [
    {
      apiURLv2: "http://localhost:3000",
      apiUrl: "https://zksync2-testnet-explorer.zksync.dev",
      hostnames: ["localhost"],
      icon: "/images/icons/zksync-arrows.svg",
      l1ExplorerUrl: "https://goerli.etherscan.io",
      l2ChainId: 270,
      l2NetworkName: "Local",
      l2WalletUrl: "https://goerli.staging-portal.zksync.dev/",
      maintenance: false,
      name: "local",
      newProverUrl: "https://storage.googleapis.com/zksync-era-testnet-proofs/proofs_fri",
      published: true,
      rpcUrl: "http://localhost:3050",
    },
    ...stagingConfig.networks,
  ],
};

export default config;
