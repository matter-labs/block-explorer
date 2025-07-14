export type NetworkConfig = {
  groupId?: string;
  name: string;
  icon: string;
  verificationApiUrl?: string;
  apiUrl: string;
  rpcUrl: string;
  bridgeUrl?: string;
  l2NetworkName: string;
  l2ChainId: 270 | 300 | 324 | 50104 | 531050104;
  l1ExplorerUrl?: string;
  settlementChains?: SettlementChain[];
  maintenance: boolean;
  published: boolean;
  hostnames: string[];
  tokensMinLiquidity?: number;
  zkTokenAddress?: string;
  baseTokenAddress: string;
  excludeTokenAddresses?: string[];
};

export type SettlementChain = {
  explorerUrl: string;
  name: string;
  chainId: number;
};

export type EnvironmentConfig = {
  networks: NetworkConfig[];
};

export type RuntimeConfig = {
  version: string;
  sentryDSN: string;
  appEnvironment: string;
  environmentConfig?: EnvironmentConfig;
};
