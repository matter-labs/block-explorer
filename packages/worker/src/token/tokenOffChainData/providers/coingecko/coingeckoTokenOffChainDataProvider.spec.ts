import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse, AxiosError } from "axios";
import { setTimeout } from "timers/promises";
import * as rxjs from "rxjs";
import { CoingeckoTokenOffChainDataProvider } from "./coingeckoTokenOffChainDataProvider";

const bridgedTokens = ["someAddress", "address1"];
const providerTokensListResponse = [
  {
    id: "ethereum",
    platforms: {},
  },
  {
    id: "token1",
    platforms: {
      ethereum: "address1",
    },
  },
  {
    id: "token2",
    platforms: {
      somePlatform: "address22",
      zksync: "address2",
    },
  },
  {
    id: "token3",
    platforms: {
      somePlatform: "address3",
    },
  },
];

jest.useFakeTimers().setSystemTime(new Date("2023-01-01T02:00:00.000Z"));

jest.mock("timers/promises", () => ({
  setTimeout: jest.fn().mockResolvedValue(null),
}));

describe("CoingeckoTokenOffChainDataProvider", () => {
  let provider: CoingeckoTokenOffChainDataProvider;
  let configServiceMock: ConfigService;
  let httpServiceMock: HttpService;

  beforeEach(async () => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValueOnce(true).mockReturnValueOnce("apiKey"),
    });
    httpServiceMock = mock<HttpService>();
    const module = await Test.createTestingModule({
      providers: [
        CoingeckoTokenOffChainDataProvider,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    provider = module.get<CoingeckoTokenOffChainDataProvider>(CoingeckoTokenOffChainDataProvider);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getTokensOffChainData", () => {
    let pipeMock = jest.fn();

    beforeEach(() => {
      pipeMock = jest.fn();
      jest.spyOn(httpServiceMock, "get").mockReturnValue({
        pipe: pipeMock,
      } as unknown as rxjs.Observable<AxiosResponse>);
      jest.spyOn(rxjs, "catchError").mockImplementation((callback) => callback as any);
    });

    it("uses correct API url and API key for pro plan", async () => {
      pipeMock.mockImplementationOnce((callback) => {
        callback({
          stack: "error stack",
          response: {
            status: 404,
          },
        } as AxiosError);
      });

      await provider.getTokensOffChainData({ bridgedTokensToInclude: bridgedTokens });
      expect(httpServiceMock.get).toBeCalledWith(
        "https://pro-api.coingecko.com/api/v3/coins/list?include_platform=true&x_cg_pro_api_key=apiKey"
      );
    });

    it("uses correct API url and API key for demo plan", async () => {
      const module = await Test.createTestingModule({
        providers: [
          CoingeckoTokenOffChainDataProvider,
          {
            provide: ConfigService,
            useValue: mock<ConfigService>({
              get: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce("apiKey"),
            }),
          },
          {
            provide: HttpService,
            useValue: httpServiceMock,
          },
        ],
      }).compile();
      module.useLogger(mock<Logger>());
      const providerWithDemoPlan = module.get<CoingeckoTokenOffChainDataProvider>(CoingeckoTokenOffChainDataProvider);

      pipeMock.mockImplementationOnce((callback) => {
        callback({
          stack: "error stack",
          response: {
            status: 404,
          },
        } as AxiosError);
      });

      await providerWithDemoPlan.getTokensOffChainData({ bridgedTokensToInclude: bridgedTokens });
      expect(httpServiceMock.get).toBeCalledWith(
        "https://api.coingecko.com/api/v3/coins/list?include_platform=true&x_cg_demo_api_key=apiKey"
      );
    });

    it("returns empty array when fetching tokens list constantly fails", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
        } as AxiosError);
      });

      const tokens = await provider.getTokensOffChainData({ bridgedTokensToInclude: bridgedTokens });
      expect(tokens).toEqual([]);
    });

    it("retries for 5 times each time doubling timeout when fetching tokens list constantly fails", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
          response: {
            data: "response data",
            status: 500,
          },
        } as AxiosError);
      });

      await provider.getTokensOffChainData({ bridgedTokensToInclude: bridgedTokens });
      expect(httpServiceMock.get).toBeCalledTimes(6);
      expect(setTimeout).toBeCalledTimes(5);
    });

    describe("when provider rate limit is reached", () => {
      describe("when server provides rate limit reset date", () => {
        it("retries API call after waiting for rate limit to reset if reset Date is in the future", async () => {
          pipeMock.mockImplementationOnce((callback) => {
            callback({
              stack: "error stack",
              response: {
                headers: {
                  "x-ratelimit-reset": "2023-01-01 02:02:00 +0000",
                } as any,
                status: 429,
              },
            } as AxiosError);
          });
          pipeMock.mockImplementationOnce((callback) => {
            callback({
              stack: "error stack",
              response: {
                status: 404,
              },
            } as AxiosError);
          });

          await provider.getTokensOffChainData({ bridgedTokensToInclude: bridgedTokens });
          expect(httpServiceMock.get).toBeCalledTimes(2);
          expect(setTimeout).toBeCalledTimes(1);
          expect(setTimeout).toBeCalledWith(121000);
        });

        it("retries API call after immediately if reset Date is not in the future", async () => {
          pipeMock.mockImplementationOnce((callback) => {
            callback({
              stack: "error stack",
              response: {
                headers: {
                  "x-ratelimit-reset": "2023-01-01 01:59:00 +0000",
                } as any,
                status: 429,
              },
            } as AxiosError);
          });
          pipeMock.mockImplementationOnce((callback) => {
            callback({
              stack: "error stack",
              response: {
                status: 404,
              },
            } as AxiosError);
          });

          await provider.getTokensOffChainData({ bridgedTokensToInclude: bridgedTokens });
          expect(httpServiceMock.get).toBeCalledTimes(2);
          expect(setTimeout).toBeCalledTimes(1);
          expect(setTimeout).toBeCalledWith(0);
        });
      });

      describe("when server does not provide rate limit reset date", () => {
        it("retries API call after waiting for 61 seconds", async () => {
          pipeMock.mockImplementationOnce((callback) => {
            callback({
              stack: "error stack",
              response: {
                headers: {},
                status: 429,
              },
            } as AxiosError);
          });
          pipeMock.mockImplementationOnce((callback) => {
            callback({
              stack: "error stack",
              response: {
                status: 404,
              },
            } as AxiosError);
          });

          await provider.getTokensOffChainData({ bridgedTokensToInclude: bridgedTokens });
          expect(httpServiceMock.get).toBeCalledTimes(2);
          expect(setTimeout).toBeCalledTimes(1);
          expect(setTimeout).toBeCalledWith(61000);
        });
      });
    });

    it("fetches offchain tokens data and returns filtered tokens list", async () => {
      pipeMock
        .mockReturnValueOnce(
          new rxjs.Observable((subscriber) => {
            subscriber.next({
              data: providerTokensListResponse,
            });
          })
        )
        .mockReturnValueOnce(
          new rxjs.Observable((subscriber) => {
            subscriber.next({
              data: [
                {
                  id: "ethereum",
                  market_cap: 100,
                  current_price: 10,
                  image: "http://ethereum.img",
                },
                {
                  id: "token1",
                  market_cap: 101,
                  current_price: 11,
                  image: "http://token1.img",
                },
                {
                  id: "token2",
                  market_cap: 102,
                  current_price: 12,
                  image: "http://token2.img",
                },
              ],
            });
          })
        );

      const tokens = await provider.getTokensOffChainData({ bridgedTokensToInclude: bridgedTokens });
      expect(httpServiceMock.get).toBeCalledTimes(2);
      expect(httpServiceMock.get).toBeCalledWith(
        "https://pro-api.coingecko.com/api/v3/coins/list?include_platform=true&x_cg_pro_api_key=apiKey"
      );
      expect(httpServiceMock.get).toBeCalledWith(
        "https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum%2Ctoken1%2Ctoken2&per_page=3&page=1&locale=en&x_cg_pro_api_key=apiKey"
      );
      expect(tokens).toEqual([
        {
          l1Address: "0x0000000000000000000000000000000000000000",
          liquidity: 100,
          usdPrice: 10,
          iconURL: "http://ethereum.img",
        },
        {
          l1Address: "address1",
          liquidity: 101,
          usdPrice: 11,
          iconURL: "http://token1.img",
        },
        {
          l2Address: "address2",
          liquidity: 102,
          usdPrice: 12,
          iconURL: "http://token2.img",
        },
      ]);
    });
  });
});
