import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { TokenService } from "../../token/token.service";
import { Token } from "../../token/token.entity";
import { StatsController } from "./stats.controller";
import { BASE_TOKEN_L2_ADDRESS } from "../../common/constants";

describe("StatsController", () => {
  let controller: StatsController;
  let tokenServiceMock: TokenService;
  let configServiceMock: ConfigService;

  beforeEach(async () => {
    tokenServiceMock = mock<TokenService>({
      findOne: jest.fn().mockResolvedValue(null),
    });
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockResolvedValue({
        l2Address: BASE_TOKEN_L2_ADDRESS,
      }),
    });

    const module = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [
        {
          provide: TokenService,
          useValue: tokenServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    controller = module.get<StatsController>(StatsController);
  });

  describe("ethPrice", () => {
    it("returns ok response and ETH price when ETH token is found", async () => {
      jest.spyOn(tokenServiceMock, "findOne").mockResolvedValueOnce({
        usdPrice: 1000,
        offChainDataUpdatedAt: new Date("2023-03-03"),
      } as Token);

      const response = await controller.ethPrice();
      expect(response).toEqual({
        status: "1",
        message: "OK",
        result: {
          ethusd: "1000",
          ethusd_timestamp: Math.floor(new Date("2023-03-03").getTime() / 1000).toString(),
        },
      });
    });

    it("returns ok response and ETH price with default values when ETH token doesn't have price details", async () => {
      jest.spyOn(tokenServiceMock, "findOne").mockResolvedValueOnce({} as Token);

      const response = await controller.ethPrice();
      expect(response).toEqual({
        status: "1",
        message: "OK",
        result: {
          ethusd: "",
          ethusd_timestamp: "",
        },
      });
    });

    it("returns not ok response and no ETH price info when ETH token is not found", async () => {
      const response = await controller.ethPrice();
      expect(response).toEqual({
        status: "0",
        message: "No data found",
        result: null,
      });
    });
  });
});
