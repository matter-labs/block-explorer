import { Controller, Get, Query, UseFilters } from "@nestjs/common";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { ParseAddressPipe } from "../../common/pipes/parseAddress.pipe";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { ApiExceptionFilter } from "../exceptionFilter";
import { NativeERC20InfoResponse, TokenInfoResponseDto } from "../dtos/token/tokenInfo.dto";
import { TokenService } from "../../token/token.service";
import * as ethers from "zksync-web3";

const entityName = "token";

@ApiExcludeController()
@ApiTags(entityName)
@Controller(`api/${entityName}`)
@UseFilters(ApiExceptionFilter)
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get("/tokeninfo")
  public async tokenInfo(
    @Query("contractaddress", new ParseAddressPipe({ errorMessage: "Error! Invalid contract address format" }))
    contractAddress: string
  ): Promise<TokenInfoResponseDto> {
    const token = await this.tokenService.findOne(contractAddress);
    return {
      status: token ? ResponseStatus.OK : ResponseStatus.NOTOK,
      message: token ? ResponseMessage.OK : ResponseMessage.NO_DATA_FOUND,
      result: token
        ? [
            {
              contractAddress: token.l2Address,
              tokenName: token.name || "",
              symbol: token.symbol,
              tokenDecimal: token.decimals.toString(),
              tokenPriceUSD: token.usdPrice?.toString() || "",
              liquidity: token.liquidity?.toString() || "",
              l1Address: token.l1Address || "",
              iconURL: token.iconURL || "",
            },
          ]
        : [],
    };
  }
  @Get("/nativeERC20Info")
  public async nativeERC20Info(): Promise<NativeERC20InfoResponse> {
    const abi = [
      "function balanceOf(address owner) view returns (string)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];
    const gethUrl = "http://localhost:8545";
    const url = "http://127.0.0.1:3050";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "zks_getNativeTokenAddress",
        params: [],
        id: 1,
      }),
    };
    const response = await fetch(url, requestOptions);
    const response_json = await response.json();
    const l1Address: string = response_json.result;
    const l2Address = "0x0000000000000000000000000000000000000000";
    const provider = new ethers.Provider(gethUrl);
    const erc20_api = new ethers.Contract(l1Address, abi, provider);
    const symbol: string = await erc20_api.symbol();
    const decimals: string = await erc20_api.decimals();
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: {
        symbol,
        decimals,
        l1Address,
        l2Address,
      },
    };
  }
}
