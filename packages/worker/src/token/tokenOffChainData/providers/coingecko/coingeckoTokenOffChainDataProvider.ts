import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { setTimeout } from "timers/promises";
import { catchError, firstValueFrom } from "rxjs";
import { utils } from "zksync-ethers";
import { TokenOffChainDataProvider, ITokenOffChainData } from "../../tokenOffChainDataProvider.abstract";

const API_INITIAL_RETRY_TIMEOUT = 5000;
const API_RETRY_ATTEMPTS = 5;

interface ITokenListItemProviderResponse {
  id: string;
  platforms: Record<string, string>;
}

interface ITokenMarketDataProviderResponse {
  id: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
}

class ProviderResponseError extends Error {
  constructor(message: string, public readonly status: number, public readonly rateLimitResetDate?: Date) {
    super(message);
  }
}

@Injectable()
export class CoingeckoTokenOffChainDataProvider implements TokenOffChainDataProvider {
  private readonly logger: Logger;
  private readonly isProPlan: boolean;
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly platformId: string;

  constructor(configService: ConfigService, private readonly httpService: HttpService) {
    this.logger = new Logger(CoingeckoTokenOffChainDataProvider.name);
    this.isProPlan = configService.get<boolean>("tokens.coingecko.isProPlan");
    this.apiKey = configService.get<string>("tokens.coingecko.apiKey");
    this.apiUrl = this.isProPlan ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
    this.platformId = configService.get<string>("COINGECKO_PLATFORM_ID", "zksync"); // Default to zksync for backward compatibility
  }

  public async getTokensOffChainData({
    bridgedTokensToInclude,
  }: {
    bridgedTokensToInclude: string[];
  }): Promise<ITokenOffChainData[]> {
    const tokensList = await this.getTokensList();
    if (!tokensList?.length) {
      return [];
    }

    // Include ETH, all chain-specific tokens and bridged tokens
    const supportedTokens = tokensList.filter(
      (token) =>
        token.id === "ethereum" ||
        (token.platforms &&
          (token.platforms[this.platformId] ||
            bridgedTokensToInclude.some(
              (bridgetTokenAddress) =>
                bridgetTokenAddress.toLowerCase() === (token.platforms.ethereum || "").toLowerCase()
            )))
    );

    if (!supportedTokens.length) {
      return [];
    }

    const tokenIds = supportedTokens.map((token) => token.id);
    const tokensMarkedData = await this.makeApiRequest<ITokenMarketDataProviderResponse[]>("/coins/markets", {
      vs_currency: "usd",
      ids: tokenIds.join(","),
      per_page: tokenIds.length.toString(),
      page: "1",
      locale: "en",
    });

    if (!tokensMarkedData) {
      return [];
    }

    return tokensMarkedData
      .map((tokenMarketData) => {
        const token = supportedTokens.find((t) => t.id === tokenMarketData.id);
        if (!token) return null;
        return {
          l1Address: token.id === "ethereum" ? utils.ETH_ADDRESS : token.platforms.ethereum,
          l2Address: token.platforms[this.platformId],
          liquidity: tokenMarketData.market_cap,
          usdPrice: tokenMarketData.current_price,
          iconURL: tokenMarketData.image,
        };
      })
      .filter(Boolean);
  }

  private async getTokensList() {
    const list = await this.makeApiRequestRetryable<ITokenListItemProviderResponse[]>({
      path: "/coins/list",
      query: {
        include_platform: "true",
      },
    });
    if (!list) {
      return [];
    }
    return list.map((item) => ({
      ...item,
      platforms: {
        // use substring(0, 42) to fix some instances when after address there is some additional text
        [this.platformId]: item.platforms[this.platformId]?.substring(0, 42),
        ethereum: item.platforms.ethereum?.substring(0, 42),
      },
    }));
  }

  private async makeApiRequestRetryable<T>({
    path,
    query,
    retryAttempt = 0,
    retryTimeout = API_INITIAL_RETRY_TIMEOUT,
  }: {
    path: string;
    query?: Record<string, string>;
    retryAttempt?: number;
    retryTimeout?: number;
  }): Promise<T> {
    try {
      return await this.makeApiRequest<T>(path, query);
    } catch (err) {
      if (err.status === 404) {
        return null;
      }
      if (err.status === 429) {
        const rateLimitResetIn = err.rateLimitResetDate.getTime() - new Date().getTime();
        await setTimeout(rateLimitResetIn >= 0 ? rateLimitResetIn + 1000 : 0);
        return this.makeApiRequestRetryable<T>({
          path,
          query,
        });
      }
      if (retryAttempt >= API_RETRY_ATTEMPTS) {
        this.logger.error({
          message: `Failed to fetch data at ${path} from coingecko after ${retryAttempt} retries`,
          provider: CoingeckoTokenOffChainDataProvider.name,
        });
        return null;
      }
      await setTimeout(retryTimeout);
      return this.makeApiRequestRetryable<T>({
        path,
        query,
        retryAttempt: retryAttempt + 1,
        retryTimeout: retryTimeout * 2,
      });
    }
  }

  private async makeApiRequest<T>(path: string, query?: Record<string, string>): Promise<T> {
    const queryString = new URLSearchParams({
      ...query,
      ...(this.isProPlan
        ? {
            x_cg_pro_api_key: this.apiKey,
          }
        : {
            x_cg_demo_api_key: this.apiKey,
          }),
    }).toString();

    const { data } = await firstValueFrom<{ data: T }>(
      this.httpService.get(`${this.apiUrl}${path}?${queryString}`).pipe(
        catchError((error: AxiosError) => {
          if (error.response?.status === 429) {
            const rateLimitReset = error.response.headers["x-ratelimit-reset"];
            // use specified reset date or 60 seconds by default
            const rateLimitResetDate = rateLimitReset
              ? new Date(rateLimitReset)
              : new Date(new Date().getTime() + 60000);
            this.logger.debug({
              message: `Reached coingecko rate limit, reset at ${rateLimitResetDate}`,
              stack: error.stack,
              status: error.response.status,
              response: error.response.data,
              provider: CoingeckoTokenOffChainDataProvider.name,
            });
            throw new ProviderResponseError(error.message, error.response.status, rateLimitResetDate);
          }
          this.logger.error({
            message: `Failed to fetch data at ${path} from coingecko`,
            stack: error.stack,
            status: error.response?.status,
            response: error.response?.data,
            provider: CoingeckoTokenOffChainDataProvider.name,
          });
          throw new ProviderResponseError(error.message, error.response?.status);
        })
      )
    );
    return data;
  }
}
