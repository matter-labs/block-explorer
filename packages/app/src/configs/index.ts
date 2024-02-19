export type NetworkConfig = {
  name: string;
  icon: string;
  verificationApiUrl?: string;
  apiUrl: string;
  rpcUrl: string;
  bridgeUrl?: string;
  l2NetworkName: string;
  l2ChainId: 270 | 280 | 324;
  l1ExplorerUrl?: string;
  maintenance: boolean;
  published: boolean;
  hostnames: string[];
  tokensMinLiquidity?: number;
};
export type IconsList={
  [key:string]:string
}
export type EnvironmentConfig = {
  networks: NetworkConfig[];
  iconsList:IconsList
};

export type RuntimeConfig = {
  version: string;
  sentryDSN: string;
  appEnvironment: string;
  environmentConfig?: EnvironmentConfig;
};
