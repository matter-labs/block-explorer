import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AxiosResponse, AxiosError } from "axios";
import * as rxjs from "rxjs";
import { DataFetcherService } from "./dataFetcher.service";

jest.mock("timers/promises", () => ({
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

    beforeEach(() => {
      pipeMock = jest.fn();
      jest.spyOn(httpServiceMock, "get").mockReturnValue({
        pipe: pipeMock,
      } as unknown as rxjs.Observable<AxiosResponse>);
      jest.spyOn(rxjs, "catchError").mockImplementation((callback) => callback as any);
    });

    it("returns block data", async () => {
      const blockData = { block: { number: 1 } };
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

    it("throws an error if the request fails with populated response details", async () => {
      const error = new AxiosError("server error", "500", null, null, {
        status: 500,
        data: "error data",
      } as AxiosResponse<string, any>);
      pipeMock.mockImplementation((callback) => {
        callback(error);
      });

      await expect(dataFetcherService.getBlockData(1)).rejects.toThrowError(error);
    });

    it("throws an error if the request fails without populated response details", async () => {
      const error = new AxiosError("server error", "500");
      pipeMock.mockImplementation((callback) => {
        callback(error);
      });

      await expect(dataFetcherService.getBlockData(1)).rejects.toThrowError(error);
    });
  });
});
