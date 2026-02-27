import { Controller, Get, Query, UseFilters } from "@nestjs/common";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { PagingOptionsWithMaxItemsLimitDto } from "../dtos/common/pagingOptionsWithMaxItemsLimit.dto";
import { ParseAddressPipe } from "../../common/pipes/parseAddress.pipe";
import { ParseTopicPipe } from "../../common/pipes/parseTopic.pipe";
import { ParseLimitedIntPipe } from "../../common/pipes/parseLimitedInt.pipe";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { ApiExceptionFilter } from "../exceptionFilter";
import { LogsResponseDto } from "../dtos/log/logs.dto";
import { LogService } from "../../log/log.service";
import { mapLogListItem } from "../mappers/logMapper";

const entityName = "logs";

@ApiExcludeController()
@ApiTags(entityName)
@Controller(`api/${entityName}`)
@UseFilters(ApiExceptionFilter)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get("/getLogs")
  public async getLogs(
    @Query("address", new ParseAddressPipe({ errorMessage: "Error! Invalid address format" }))
    address: string,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Query("fromBlock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) fromBlock?: number,
    @Query("toBlock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) toBlock?: number,
    @Query("topic0", new ParseTopicPipe({ required: false, errorMessage: "Error! Invalid topic0 format" }))
    topic0?: string
  ): Promise<LogsResponseDto> {
    const logs = await this.logService.findMany({
      address,
      fromBlock,
      toBlock,
      topics: {
        topic0,
      },
      order: "ASC",
      ...pagingOptions,
    });
    const logsList = logs.map((log) => mapLogListItem(log));
    return {
      status: logsList.length ? ResponseStatus.OK : ResponseStatus.NOTOK,
      message: logsList.length ? ResponseMessage.OK : ResponseMessage.NO_RECORD_FOUND,
      result: logsList,
    };
  }
}
