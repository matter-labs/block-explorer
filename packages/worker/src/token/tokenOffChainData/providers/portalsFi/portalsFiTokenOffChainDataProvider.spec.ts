import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse, AxiosError } from "axios";
import { setTimeout } from "timers/promises";
import * as rxjs from "rxjs";
import { PortalsFiTokenOffChainDataProvider } from "./portalsFiTokenOffChainDataProvider";

const MIN_TOKENS_LIQUIDITY_FILTER = 0;
const TOKENS_INFO_API_URL = "https://api.portals.fi/v2/tokens";
const TOKENS_INFO_API_QUERY = `networks=ethereum&limit=250&sortBy=liquidity&sortDirection=desc`;

const providerTokensResponse = [
  {
    address: "address1",
    liquidity: 1000000,
    price: 50.7887667,
    image: "http://image1.com",
  },
  {
    address: "address2",
    liquidity: 2000000,
    price: 20.3454334,
    images: ["http://image2.com"],
  },
  {
    address: "address3",
    liquidity: 3000000,
    price: 10.7678787,
  },
];

jest.mock("timers/promises", () => ({
  setTimeout: jest.fn().mockResolvedValue(null),
}));

describe("PortalsFiTokenOffChainDataProvider", () => {
  let provider: PortalsFiTokenOffChainDataProvider;
  let httpServiceMock: HttpService;

  beforeEach(async () => {
    httpServiceMock = mock<HttpService>();
    const module = await Test.createTestingModule({
      providers: [
        PortalsFiTokenOffChainDataProvider,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    provider = module.get<PortalsFiTokenOffChainDataProvider>(PortalsFiTokenOffChainDataProvider);
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

    it("returns empty array when fetching offchain data constantly fails", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
        } as AxiosError);
      });

      const tokens = await provider.getTokensOffChainData(MIN_TOKENS_LIQUIDITY_FILTER);
      expect(tokens).toEqual([]);
    });

    it("retries for 5 times each time doubling timeout when fetching offchain data constantly fails", async () => {
      pipeMock.mockImplementation((callback) => {
        callback({
          stack: "error stack",
          response: {
            data: "response data",
            status: 500,
          },
        } as AxiosError);
      });

      await provider.getTokensOffChainData(MIN_TOKENS_LIQUIDITY_FILTER);
      expect(httpServiceMock.get).toBeCalledTimes(6);
      expect(setTimeout).toBeCalledTimes(5);
    });

    it("fetches offchain tokens data with pagination and returns combined tokens list", async () => {
      pipeMock
        .mockReturnValueOnce(
          new rxjs.Observable((subscriber) => {
            subscriber.next({
              data: {
                more: true,
                tokens: [providerTokensResponse[0]],
              },
            });
          })
        )
        .mockReturnValueOnce(
          new rxjs.Observable((subscriber) => {
            subscriber.next({
              data: {
                more: false,
                tokens: [providerTokensResponse[1]],
              },
            });
          })
        );

      const tokens = await provider.getTokensOffChainData(MIN_TOKENS_LIQUIDITY_FILTER);
      expect(httpServiceMock.get).toBeCalledTimes(2);
      expect(httpServiceMock.get).toBeCalledWith(`${TOKENS_INFO_API_URL}?${TOKENS_INFO_API_QUERY}&page=0`);
      expect(httpServiceMock.get).toBeCalledWith(`${TOKENS_INFO_API_URL}?${TOKENS_INFO_API_QUERY}&page=1`);
      expect(tokens).toEqual([
        {
          l1Address: "address1",
          liquidity: 1000000,
          usdPrice: 50.7887667,
          iconURL: "http://image1.com",
        },
        {
          l1Address: "address2",
          liquidity: 2000000,
          usdPrice: 20.3454334,
          iconURL: "http://image2.com",
        },
      ]);
    });

    it("includes minLiquidity filter when provided minLiquidity filter > 0", async () => {
      pipeMock.mockReturnValueOnce(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: {
              more: false,
              tokens: [providerTokensResponse[0]],
            },
          });
        })
      );

      await provider.getTokensOffChainData(1000000);
      expect(httpServiceMock.get).toBeCalledTimes(1);
      expect(httpServiceMock.get).toBeCalledWith(
        `${TOKENS_INFO_API_URL}?${TOKENS_INFO_API_QUERY}&page=0&minLiquidity=1000000`
      );
    });

    it("retries when provider API call fails", async () => {
      pipeMock
        .mockImplementationOnce((callback) => {
          callback({
            stack: "error stack",
            response: {
              data: "response data",
              status: 500,
            },
          } as AxiosError);
        })
        .mockReturnValueOnce(
          new rxjs.Observable((subscriber) => {
            subscriber.next({
              data: {
                more: false,
                tokens: providerTokensResponse,
              },
            });
          })
        );

      const tokens = await provider.getTokensOffChainData(MIN_TOKENS_LIQUIDITY_FILTER);
      expect(httpServiceMock.get).toBeCalledTimes(2);
      expect(httpServiceMock.get).toBeCalledWith(`${TOKENS_INFO_API_URL}?${TOKENS_INFO_API_QUERY}&page=0`);
      expect(httpServiceMock.get).toBeCalledWith(`${TOKENS_INFO_API_URL}?${TOKENS_INFO_API_QUERY}&page=0`);
      expect(tokens).toEqual([
        {
          l1Address: "address1",
          liquidity: 1000000,
          usdPrice: 50.7887667,
          iconURL: "http://image1.com",
        },
        {
          l1Address: "address2",
          liquidity: 2000000,
          usdPrice: 20.3454334,
          iconURL: "http://image2.com",
        },
        {
          l1Address: "address3",
          liquidity: 3000000,
          usdPrice: 10.7678787,
        },
      ]);
    });
  });
});
