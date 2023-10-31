import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import { setTimeout } from "timers/promises";
import { catchError, firstValueFrom } from "rxjs";
import { TokenInfoProvider, ITokenInfo } from "../tokenInfoProvider.abstract";

const TOKENS_INFO_API_URL = "https://api.portals.fi/v2/tokens";
const API_INITIAL_RETRY_TIMEOUT = 5000;
const API_RETRY_ATTEMPTS = 5;

interface ITokensInfoPage {
  hasMore: boolean;
  tokens: ITokenInfo[];
}

interface ITokenInfoProviderResponse {
  address: string;
  image?: string;
  liquidity: number;
  price: number;
}

interface ITokensInfoProviderResponse {
  more: boolean;
  tokens: ITokenInfoProviderResponse[];
}

@Injectable()
export class PortalsFiTokenInfoProvider implements TokenInfoProvider {
  private readonly logger: Logger;

  constructor(private readonly httpService: HttpService) {
    this.logger = new Logger(PortalsFiTokenInfoProvider.name);
  }

  public async getTokensInfo(minLiquidity: number): Promise<ITokenInfo[]> {
    let page = 0;
    let hasMore = true;
    const tokens = [];

    while (hasMore) {
      const tokensInfoPage = await this.getTokensInfoPageRetryable({ page, minLiquidity });
      tokens.push(...tokensInfoPage.tokens);
      page++;
      hasMore = tokensInfoPage.hasMore;
    }

    return tokens;
  }

  private async getTokensInfoPageRetryable({
    page,
    minLiquidity,
    retryAttempt = 0,
    retryTimeout = API_INITIAL_RETRY_TIMEOUT,
  }: {
    page: number;
    minLiquidity: number;
    retryAttempt?: number;
    retryTimeout?: number;
  }): Promise<ITokensInfoPage> {
    try {
      return await this.getTokensInfoPage({ page, minLiquidity });
    } catch {
      if (retryAttempt > API_RETRY_ATTEMPTS) {
        this.logger.error({
          message: `Failed to fetch tokens info at page=${page} after ${retryAttempt} retries`,
          provider: PortalsFiTokenInfoProvider.name,
        });
        return {
          hasMore: false,
          tokens: [],
        };
      }
      await setTimeout(retryTimeout);
      return this.getTokensInfoPageRetryable({
        page,
        minLiquidity,
        retryAttempt: retryAttempt + 1,
        retryTimeout: retryTimeout * 2,
      });
    }
  }

  private async getTokensInfoPage({
    page,
    minLiquidity,
  }: {
    page: number;
    minLiquidity: number;
  }): Promise<ITokensInfoPage> {
    const queryString = `networks=ethereum&limit=250&sortBy=liquidity&minLiquidity=${minLiquidity}&sortDirection=desc&page=${page}`;

    const { data } = await firstValueFrom<{ data: ITokensInfoProviderResponse }>(
      this.httpService.get(`${TOKENS_INFO_API_URL}?${queryString}`).pipe(
        catchError((error: AxiosError) => {
          this.logger.error({
            message: `Failed to fetch tokens info at page=${page}`,
            stack: error.stack,
            response: error.response?.data,
            provider: PortalsFiTokenInfoProvider.name,
          });
          throw new Error(`Failed to fetch tokens info at page=${page}`);
        })
      )
    );

    return {
      hasMore: data.more,
      tokens: data.tokens.map((token) => ({
        l1Address: token.address,
        liquidity: token.liquidity,
        usdPrice: token.price,
        iconURL: token.image,
      })),
    };
  }
}
