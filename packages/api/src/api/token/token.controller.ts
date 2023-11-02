import { Controller, Get, Query, UseFilters } from "@nestjs/common";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { ParseAddressPipe } from "../../common/pipes/parseAddress.pipe";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { ApiExceptionFilter } from "../exceptionFilter";
import { TokenInfoResponseDto } from "../dtos/token/tokenInfo.dto";
import { TokenService } from "../../token/token.service";

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
}
