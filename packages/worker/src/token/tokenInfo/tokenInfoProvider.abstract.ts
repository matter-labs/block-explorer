export interface ITokenInfo {
  l1Address: string;
  liquidity: number;
  usdPrice: number;
  iconURL?: string;
}

export abstract class TokenInfoProvider {
  abstract getTokensInfo: (minLiquidity: number) => Promise<ITokenInfo[]>;
}
