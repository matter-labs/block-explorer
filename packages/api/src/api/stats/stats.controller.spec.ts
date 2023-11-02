import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { TokenService } from "../../token/token.service";
import { Token, ETH_TOKEN } from "../../token/token.entity";
import { StatsController } from "./stats.controller";

describe("StatsController", () => {
  let controller: StatsController;
  let tokenServiceMock: TokenService;

  beforeEach(async () => {
    tokenServiceMock = mock<TokenService>({
      findOne: jest.fn().mockResolvedValue(null),
    });

    const module = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [
        {
          provide: TokenService,
          useValue: tokenServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    controller = module.get<StatsController>(StatsController);
  });

  describe("ethPrice", () => {
    it("returns ok response and ETH price when ETH token is found", async () => {
      jest.spyOn(tokenServiceMock, "findOne").mockResolvedValueOnce({
        usdPrice: ETH_TOKEN.usdPrice,
        offChainDataUpdatedAt: new Date("2023-03-03"),
      } as Token);

      const response = await controller.ethPrice();
      expect(response).toEqual({
        status: "1",
        message: "OK",
        result: {
          ethusd: ETH_TOKEN.usdPrice.toString(),
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
