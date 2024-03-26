import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AxiosResponse, AxiosError } from "axios";
import * as rxjs from "rxjs";
import { setTimeout } from "node:timers/promises";
import { DataFetcherService } from "./dataFetcher.service";

jest.mock("node:timers/promises", () => ({
  setTimeout: jest.fn().mockResolvedValue(null),
}));

describe("DataFetcherService", () => {
  let dataFetcherService: DataFetcherService;
  let httpServiceMock: HttpService;
  let configServiceMock: ConfigService;
  const DATA_FETCHER_API_URL = "https://zksync-era-data-fetcher";
  const requestTimeout = 120000;

  beforeEach(async () => {
    httpServiceMock = mock<HttpService>();
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValueOnce(DATA_FETCHER_API_URL).mockReturnValueOnce(requestTimeout),
    });

    const module = await Test.createTestingModule({
      providers: [
        DataFetcherService,
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

    dataFetcherService = module.get<DataFetcherService>(DataFetcherService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getBlockData", () => {
    let pipeMock = jest.fn();
    const blockData = { block: { number: 1 } };

    beforeEach(() => {
      pipeMock = jest.fn();
      jest.spyOn(httpServiceMock, "get").mockReturnValue({
        pipe: pipeMock,
      } as unknown as rxjs.Observable<AxiosResponse>);
      jest.spyOn(rxjs, "catchError").mockImplementation((callback) => callback as any);
    });

    it("returns block data", async () => {
      pipeMock.mockReturnValueOnce(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: [blockData],
          });
        })
      );

      const returnedBlockData = await dataFetcherService.getBlockData(1);
      expect(httpServiceMock.get).toBeCalledTimes(1);
      expect(httpServiceMock.get).toBeCalledWith(`${DATA_FETCHER_API_URL}/blocks?from=${1}&to=${1}`, {
        timeout: requestTimeout,
      });
      expect(returnedBlockData).toEqual(blockData);
    });

    it("retries the request if the request fails with populated response details", async () => {
      const error = new AxiosError("server error", "500", null, null, {
        status: 500,
        data: "error data",
      } as AxiosResponse<string, any>);
      pipeMock.mockImplementationOnce((callback) => {
        callback(error);
      });

      pipeMock.mockReturnValueOnce(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: [blockData],
          });
        })
      );

      const returnedBlockData = await dataFetcherService.getBlockData(1);
      expect(httpServiceMock.get).toBeCalledTimes(2);
      expect(setTimeout).toBeCalledTimes(1);
      expect(setTimeout).toBeCalledWith(1000);
      expect(returnedBlockData).toEqual(blockData);
    });

    it("retries the request if the request fails without populated response details", async () => {
      const error = new AxiosError("server error", "500");
      pipeMock.mockImplementationOnce((callback) => {
        callback(error);
      });

      pipeMock.mockReturnValueOnce(
        new rxjs.Observable((subscriber) => {
          subscriber.next({
            data: [blockData],
          });
        })
      );

      const returnedBlockData = await dataFetcherService.getBlockData(1);
      expect(httpServiceMock.get).toBeCalledTimes(2);
      expect(setTimeout).toBeCalledTimes(1);
      expect(setTimeout).toBeCalledWith(1000);
      expect(returnedBlockData).toEqual(blockData);
    });
  });
});
