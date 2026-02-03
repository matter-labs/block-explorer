export type NetworkConfig = {
  groupId?: string;
  name: string;
  icon: string;
  logoUrl?: string;
  logoInverseUrl?: string;
  heroBannerImageUrl?: string;
  verificationApiUrl?: string;
  apiUrl: string;
  rpcUrl: string;
  prividium?: boolean;
  userPanelUrl?: string;
  bridgeUrl?: string;
  l2NetworkName: string;
  l2ChainId: number;
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
  name: string;
  chainId: number;
};

export type EnvironmentConfig = {
  networks: NetworkConfig[];
};

export type ColorShades = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type ColorsConfig = {
  primary?: string | ColorShades;
  secondary?: string | ColorShades;
  neutral?: string | ColorShades;
  success?: string | ColorShades;
  error?: string | ColorShades;
  warning?: string | ColorShades;
};

export type RuntimeConfig = {
  version: string;
  sentryDSN: string;
  brandName: string;
  appEnvironment: "default" | "dev" | "local" | "prividium" | "production" | "staging";
  links: {
    discordUrl: string;
    xUrl: string;
    docsUrl: string;
    termsOfServiceUrl: string;
    contactUsUrl: string;
  };
  environmentConfig?: EnvironmentConfig;
  theme?: {
    colors?: ColorsConfig;
  };
};
