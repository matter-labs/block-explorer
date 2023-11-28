import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import { setTimeout } from "timers/promises";
import { catchError, firstValueFrom } from "rxjs";
import { TokenOffChainDataProvider, ITokenOffChainData } from "../../tokenOffChainDataProvider.abstract";

const TOKENS_INFO_API_URL = "https://api.portals.fi/v2/tokens";
const API_INITIAL_RETRY_TIMEOUT = 5000;
const API_RETRY_ATTEMPTS = 5;

interface ITokensOffChainDataPage {
  hasMore: boolean;
  tokens: ITokenOffChainData[];
}

interface ITokenOffChainDataProviderResponse {
  address: string;
  image?: string;
  images?: string[];
  liquidity: number;
  price: number;
}

interface ITokensOffChainDataProviderResponse {
  more: boolean;
  tokens: ITokenOffChainDataProviderResponse[];
}

@Injectable()
export class PortalsFiTokenOffChainDataProvider implements TokenOffChainDataProvider {
  private readonly logger: Logger;

  constructor(private readonly httpService: HttpService) {
    this.logger = new Logger(PortalsFiTokenOffChainDataProvider.name);
  }

  public async getTokensOffChainData({
    bridgedTokensToInclude,
  }: {
    bridgedTokensToInclude: string[];
  }): Promise<ITokenOffChainData[]> {
    let page = 0;
    let hasMore = true;
    const tokens = [];

    // This provider only supports bridged tokens
    if (!bridgedTokensToInclude.length) {
      return [];
    }

    while (hasMore) {
      const tokensInfoPage = await this.getTokensOffChainDataPageRetryable({ page });
      tokens.push(...tokensInfoPage.tokens);
      page++;
      hasMore = tokensInfoPage.hasMore;
    }

    return tokens.filter((token) =>
      bridgedTokensToInclude.find((bridgetTokenAddress) => bridgetTokenAddress === token.l1Address)
    );
  }

  private async getTokensOffChainDataPageRetryable({
    page,
    retryAttempt = 0,
    retryTimeout = API_INITIAL_RETRY_TIMEOUT,
  }: {
    page: number;
    retryAttempt?: number;
    retryTimeout?: number;
  }): Promise<ITokensOffChainDataPage> {
    try {
      return await this.getTokensOffChainDataPage({ page });
    } catch {
      if (retryAttempt >= API_RETRY_ATTEMPTS) {
        this.logger.error({
          message: `Failed to fetch tokens info at page=${page} after ${retryAttempt} retries`,
          provider: PortalsFiTokenOffChainDataProvider.name,
        });
        return {
          hasMore: false,
          tokens: [],
        };
      }
      await setTimeout(retryTimeout);
      return this.getTokensOffChainDataPageRetryable({
        page,
        retryAttempt: retryAttempt + 1,
        retryTimeout: retryTimeout * 2,
      });
    }
  }

  private async getTokensOffChainDataPage({ page }: { page: number }): Promise<ITokensOffChainDataPage> {
    const query = {
      networks: "ethereum",
      limit: "250",
      sortBy: "liquidity",
      sortDirection: "desc",
      page: page.toString(),
    };
    const queryString = new URLSearchParams(query).toString();

    const { data } = await firstValueFrom<{ data: ITokensOffChainDataProviderResponse }>(
      this.httpService.get(`${TOKENS_INFO_API_URL}?${queryString}`).pipe(
        catchError((error: AxiosError) => {
          this.logger.error({
            message: `Failed to fetch tokens info at page=${page}`,
            stack: error.stack,
            response: error.response?.data,
            provider: PortalsFiTokenOffChainDataProvider.name,
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
        iconURL: token.image || token.images?.[0],
      })),
    };
  }
}
