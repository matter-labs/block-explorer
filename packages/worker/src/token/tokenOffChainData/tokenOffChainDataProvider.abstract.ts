export interface ITokenOffChainData {
  l1Address?: string;
  l2Address?: string;
  liquidity?: number;
  usdPrice?: number;
  iconURL?: string;
}

export abstract class TokenOffChainDataProvider {
  abstract getTokensOffChainData: (settings: { bridgedTokensToInclude: string[] }) => Promise<ITokenOffChainData[]>;
}
