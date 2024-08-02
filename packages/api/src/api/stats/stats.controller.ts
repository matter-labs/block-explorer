import { Controller, Get, UseFilters } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { ApiExceptionFilter } from "../exceptionFilter";
import { EthPriceResponseDto } from "../dtos/stats/ethPrice.dto";
import { TokenService } from "../../token/token.service";
import { dateToTimestamp } from "../../common/utils";
import { type BaseToken } from "../../config";

const entityName = "stats";

@ApiExcludeController()
@ApiTags(entityName)
@Controller(`api/${entityName}`)
@UseFilters(ApiExceptionFilter)
export class StatsController {
  private readonly ethTokenAddress: string;

  constructor(private readonly tokenService: TokenService, private readonly configService: ConfigService) {
    this.ethTokenAddress = this.configService.get<BaseToken>("ethToken").l2Address;
  }

  @Get("/ethprice")
  public async ethPrice(): Promise<EthPriceResponseDto> {
    const token = await this.tokenService.findOne(this.ethTokenAddress, {
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
