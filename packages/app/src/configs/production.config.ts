import type { EnvironmentConfig } from ".";

const config: EnvironmentConfig = {
  networks: [
    {
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
    },
    {
      apiUrl: "https://block-explorer-api.mainnet.zksync.io",
      verificationApiUrl: "https://zksync2-mainnet-explorer.zksync.io",
      bridgeUrl: "https://bridge.zksync.io",
      hostnames: ["https://explorer.zksync.io"],
      icon: "/images/icons/zksync-arrows.svg",
      l1ExplorerUrl: "https://etherscan.io",
      l2ChainId: 324,
      l2NetworkName: "zkSync Era Mainnet",
      l2WalletUrl: "https://portal.zksync.io/",
      maintenance: false,
      name: "mainnet",
      newProverUrl: "https://storage.googleapis.com/zksync-era-mainnet-proofs/proofs_fri",
      published: true,
      rpcUrl: "https://mainnet.era.zksync.io",
    },
  ],
};

export default config;
