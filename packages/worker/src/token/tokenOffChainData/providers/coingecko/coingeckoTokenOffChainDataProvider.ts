import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { setTimeout } from "timers/promises";
import { catchError, firstValueFrom } from "rxjs";
import { ZERO_ADDRESS } from "../../../../constants";
import { TokenOffChainDataProvider, ITokenOffChainData } from "../../tokenOffChainDataProvider.abstract";

const API_NUMBER_OF_TOKENS_PER_REQUEST = 250;
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
  private readonly originPlatformIds: string[];
  private readonly platformIdsToKeep: string[];

  constructor(configService: ConfigService, private readonly httpService: HttpService) {
    this.logger = new Logger(CoingeckoTokenOffChainDataProvider.name);
    this.isProPlan = configService.get<boolean>("tokens.coingecko.isProPlan");
    this.apiKey = configService.get<string>("tokens.coingecko.apiKey");
    this.apiUrl = this.isProPlan ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
    this.platformId = configService.get<string>("tokens.coingecko.platformId");
    this.originPlatformIds = configService.get<string[]>("tokens.coingecko.originPlatformIds") || [];
    // all platform ids whose addresses are kept on the trimmed tokens list
    this.platformIdsToKeep = [...new Set([...this.originPlatformIds, this.platformId, "ethereum"])];
  }

  public async getTokensOffChainData({
    bridgedTokensToInclude,
  }: {
    bridgedTokensToInclude: string[];
  }): Promise<ITokenOffChainData[]> {
    const tokensList = await this.getTokensList();
    const bridgedTokenAddresses = new Set(bridgedTokensToInclude.map((address) => address.toLowerCase()));
    // Include ETH, all L2 tokens and bridged tokens
    const supportedTokens = tokensList.filter(
      (token) =>
        token.id === "ethereum" ||
        token.platforms[this.platformId] ||
        this.getMatchedBridgedAddresses(token, bridgedTokenAddresses).length
    );

    const tokensOffChainData: ITokenOffChainData[] = [];
    let tokenIdsPerRequest = [];
    for (let i = 0; i < supportedTokens.length; i++) {
      tokenIdsPerRequest.push(supportedTokens[i].id);
      if (tokenIdsPerRequest.length === API_NUMBER_OF_TOKENS_PER_REQUEST || i === supportedTokens.length - 1) {
        const tokensMarkedData = await this.getTokensMarketData(tokenIdsPerRequest);
        tokensOffChainData.push(
          ...tokensMarkedData.flatMap((tokenMarketData) => {
            const token = supportedTokens.find((t) => t.id === tokenMarketData.id);
            const marketData = {
              l2Address: token.platforms[this.platformId],
              liquidity: tokenMarketData.market_cap,
              usdPrice: tokenMarketData.current_price,
              iconURL: tokenMarketData.image,
            };
            if (token.id === "ethereum") {
              return [{ l1Address: ZERO_ADDRESS, ...marketData }];
            }
            // one record per matched bridged address so every bridged variant of the token gets updated
            const records: ITokenOffChainData[] = this.getMatchedBridgedAddresses(token, bridgedTokenAddresses).map(
              (bridgedAddress) => ({
                l1Address: bridgedAddress,
                ...marketData,
              })
            );
            // the zero address is never a valid origin address, so treat such entries as absent
            const ethereumAddress =
              token.platforms.ethereum && token.platforms.ethereum.toLowerCase() !== ZERO_ADDRESS
                ? token.platforms.ethereum.toLowerCase()
                : undefined;
            // bridgedTokensToInclude holds every stored l1Address, so a record keyed by an unknown
            // ethereum address would update no rows; key by l2Address instead in that case
            const bridgedEthereumAddress =
              ethereumAddress && bridgedTokenAddresses.has(ethereumAddress) ? ethereumAddress : undefined;
            // keep the record keyed by the ethereum address (or by l2Address when there is none)
            // so natively listed tokens keep receiving updates alongside their bridged variants
            if (!records.length || (!bridgedEthereumAddress && marketData.l2Address)) {
              records.push({ l1Address: bridgedEthereumAddress, ...marketData });
            }
            return records;
          })
        );
        tokenIdsPerRequest = [];
      }
    }
    return tokensOffChainData;
  }

  private getMatchedBridgedAddresses(
    token: ITokenListItemProviderResponse,
    bridgedTokenAddresses: Set<string>
  ): string[] {
    return [
      ...new Set(
        this.originPlatformIds
          .map((platformId) => token.platforms[platformId]?.toLowerCase())
          .filter((address) => address && address !== ZERO_ADDRESS && bridgedTokenAddresses.has(address))
      ),
    ];
  }

  private getTokensMarketData(tokenIds: string[]) {
    return this.makeApiRequestRetryable<ITokenMarketDataProviderResponse[]>({
      path: "/coins/markets",
      query: {
        vs_currency: "usd",
        ids: tokenIds.join(","),
        per_page: tokenIds.length.toString(),
        page: "1",
        locale: "en",
        precision: "full",
      },
    });
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
    return list
      .filter(
        (item) =>
          item.id === "ethereum" ||
          item.platforms[this.platformId] ||
          this.originPlatformIds.some((platformId) => item.platforms[platformId])
      )
      .map((item) => ({
        ...item,
        // use substring(0, 42) to fix some instances when after address there is some additional text
        platforms: Object.fromEntries(
          this.platformIdsToKeep.map((platformId) => [platformId, item.platforms[platformId]?.substring(0, 42)])
        ),
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
      return await this.makeApiRequest<T>(path, query, retryAttempt);
    } catch (err) {
      if (err.status === 404) {
        return null;
      }
      if (retryAttempt >= API_RETRY_ATTEMPTS) {
        this.logger.error({
          message: `Failed to fetch data at ${path} from coingecko after ${retryAttempt} retries`,
          provider: CoingeckoTokenOffChainDataProvider.name,
        });
        return null;
      }
      if (err.status === 429) {
        const rateLimitResetIn = err.rateLimitResetDate.getTime() - new Date().getTime();
        await setTimeout(rateLimitResetIn >= 0 ? rateLimitResetIn + 1000 : 0);
        return this.makeApiRequestRetryable<T>({
          path,
          query,
          retryAttempt: API_RETRY_ATTEMPTS, // disable retries after rate limit reset
          retryTimeout,
        });
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

  private async makeApiRequest<T>(path: string, query?: Record<string, string>, attempt?: number): Promise<T> {
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
            this.logger.error({
              message: `Reached coingecko rate limit, reset at ${rateLimitResetDate}`,
              stack: error.stack,
              status: error.response.status,
              response: error.response.data,
              provider: CoingeckoTokenOffChainDataProvider.name,
              attempt,
            });
            throw new ProviderResponseError(error.message, error.response.status, rateLimitResetDate);
          }
          this.logger.error({
            message: `Failed to fetch data at ${path} from coingecko`,
            stack: error.stack,
            status: error.response?.status,
            response: error.response?.data,
            provider: CoingeckoTokenOffChainDataProvider.name,
            attempt,
          });
          throw new ProviderResponseError(error.message, error.response?.status);
        })
      )
    );
    return data;
  }
}
