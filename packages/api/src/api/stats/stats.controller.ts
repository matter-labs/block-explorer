import { Controller, Get, UseFilters } from "@nestjs/common";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { ApiExceptionFilter } from "../exceptionFilter";
import { EthPriceResponseDto } from "../dtos/stats/ethPrice.dto";
import { TokenService } from "../../token/token.service";
import { baseToken } from "../../token/token.entity";
import { dateToTimestamp } from "../../common/utils";

const entityName = "stats";

@ApiExcludeController()
@ApiTags(entityName)
@Controller(`api/${entityName}`)
@UseFilters(ApiExceptionFilter)
export class StatsController {
  constructor(private readonly tokenService: TokenService) {}

  @Get("/ethprice")
  public async ethPrice(): Promise<EthPriceResponseDto> {
    const nativeToken = await baseToken();
    const token = await this.tokenService.findOne(nativeToken.l2Address, {
      usdPrice: true,
      offChainDataUpdatedAt: true,
    });
    return {
      status: token ? ResponseStatus.OK : ResponseStatus.NOTOK,
      message: token ? ResponseMessage.OK : ResponseMessage.NO_DATA_FOUND,
      result: token
        ? {
            ethusd: token.usdPrice?.toString() || "",
            ethusd_timestamp: token.offChainDataUpdatedAt
              ? dateToTimestamp(token.offChainDataUpdatedAt).toString()
              : "",
          }
        : null,
    };
  }
}
