export type NetworkConfig = {
  groupId?: string;
  name: string;
  icon: string;
  verificationApiUrl?: string;
  apiUrl: string;
  rpcUrl: string;
  prividium?: boolean;
  bridgeUrl?: string;
  l2NetworkName: string;
  l2ChainId: 270 | 300 | 324;
  l1ExplorerUrl?: string;
  settlementChains?: SettlementChain[];
  maintenance: boolean;
  published: boolean;
  hostnames: string[];
  tokensMinLiquidity?: number;
  zkTokenAddress?: string;
  baseTokenAddress: string;
};

export type SettlementChain = {
  explorerUrl: string;
  apiUrl?: string; // Optional API URL for chains that need it (like Gateway)
  name: string;
  chainId: number;
};

export type EnvironmentConfig = {
  networks: NetworkConfig[];
};

export type RuntimeConfig = {
  version: string;
  sentryDSN: string;
  appEnvironment: "default" | "dev" | "local" | "prividium" | "production" | "staging";
  environmentConfig?: EnvironmentConfig;
};
