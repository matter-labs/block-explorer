export interface ITokenOffChainData {
  l1Address: string;
  liquidity: number;
  usdPrice: number;
  iconURL?: string;
}

export abstract class TokenOffChainDataProvider {
  abstract getTokensOffChainData: (minLiquidity: number) => Promise<ITokenOffChainData[]>;
}
