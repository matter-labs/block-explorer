import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { TokenService } from "../../token/token.service";
import { BaseTokenService } from "./token.utils";
import { Token, baseToken } from "../../token/token.entity";
import { TokenController } from "./token.controller";

describe("TokenController", () => {
  let controller: TokenController;
  let tokenServiceMock: TokenService;

  const contractAddress = "address";

  beforeEach(async () => {
    tokenServiceMock = mock<TokenService>({
      findOne: jest.fn().mockResolvedValue(null),
    });

    const module = await Test.createTestingModule({
      controllers: [TokenController],
      providers: [
        {
          provide: TokenService,
          useValue: tokenServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    controller = module.get<TokenController>(TokenController);
  });

  describe("tokenInfo", () => {
    it("returns ok response and token info when token is found", async () => {
      const nativeToken = (await baseToken()) as Token;
      jest.spyOn(tokenServiceMock, "findOne").mockResolvedValueOnce(nativeToken);
      const response = await controller.tokenInfo(contractAddress);
      expect(response).toEqual({
        status: "1",
        message: "OK",
        result: [
          {
            contractAddress: nativeToken.l2Address,
            iconURL: nativeToken.iconURL,
            l1Address: nativeToken.l1Address,
            liquidity: nativeToken.liquidity.toString(),
            symbol: nativeToken.symbol,
            tokenDecimal: nativeToken.decimals.toString(),
            tokenName: nativeToken.name,
            tokenPriceUSD: nativeToken.usdPrice.toString(),
          },
        ],
      });
    });

    it("returns ok response and token info with default values when token doesn't have all details", async () => {
      jest.spyOn(tokenServiceMock, "findOne").mockResolvedValueOnce({
        l2Address: "0x000000000000000000000000000000000000800A",
        symbol: "",
        decimals: 6,
      } as Token);

      const response = await controller.tokenInfo(contractAddress);
      expect(response).toEqual({
        status: "1",
        message: "OK",
        result: [
          {
            contractAddress: "0x000000000000000000000000000000000000800A",
            iconURL: "",
            l1Address: "",
            liquidity: "",
            symbol: "",
            tokenDecimal: "6",
            tokenName: "",
            tokenPriceUSD: "",
          },
        ],
      });
    });

    it("returns not ok response and no token info when token is not found", async () => {
      const response = await controller.tokenInfo(contractAddress);
      expect(response).toEqual({
        status: "0",
        message: "No data found",
        result: [],
      });
    });
  });
});
