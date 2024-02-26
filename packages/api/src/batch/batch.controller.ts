import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiExcludeController,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Pagination } from "nestjs-typeorm-paginate";
import { ADDRESS_REGEX_PATTERN, ParseAddressPipe } from "src/common/pipes/parseAddress.pipe";
import { TransferService } from "src/transfer/transfer.service";
import { ApiListPageOkResponse } from "../common/decorators/apiListPageOkResponse";
import { ListFiltersDto, PagingOptionsDto } from "../common/dtos";
import { ParseLimitedIntPipe } from "../common/pipes/parseLimitedInt.pipe";
import { buildDateFilter } from "../common/utils";
import { swagger } from "../config/featureFlags";
import { BatchDto } from "./batch.dto";
import { BatchService } from "./batch.service";
import { BatchAmountDto } from "./batchAmount.dto";
import { BatchDetailsDto } from "./batchDetails.dto";

const entityName = "batches";

@ApiTags("Batch BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class BatchController {
  constructor(private readonly batchService: BatchService, private readonly transferService: TransferService) {}

  @Get("")
  @ApiListPageOkResponse(BatchDto, { description: "Successfully returned batch list" })
  @ApiBadRequestResponse({ description: "Query params are not valid or out of range" })
  public async getBatches(
    @Query() listFilterOptions: ListFiltersDto,
    @Query() pagingOptions: PagingOptionsDto
  ): Promise<Pagination<BatchDto>> {
    const filterCriteria = buildDateFilter(listFilterOptions.fromDate, listFilterOptions.toDate);
    return await this.batchService.findAll(filterCriteria, {
      filterOptions: listFilterOptions,
      ...pagingOptions,
      route: entityName,
      canUseNumberFilterAsOffset: true,
    });
  }

  @Get(":batchNumber")
  @ApiParam({
    name: "batchNumber",
    type: "integer",
    example: "1",
    description: "Batch number",
  })
  @ApiOkResponse({ description: "Batch was returned successfully", type: BatchDetailsDto })
  @ApiBadRequestResponse({ description: "Batch number is invalid" })
  @ApiNotFoundResponse({ description: "Batch with the specified number does not exist" })
  public async getBatch(
    @Param("batchNumber", new ParseLimitedIntPipe({ min: 0 })) batchNumber: number
  ): Promise<BatchDetailsDto> {
    const batch = await this.batchService.findOne(batchNumber);
    if (!batch) {
      throw new NotFoundException();
    }
    return batch;
  }

  @Get("amount/:batchNumber/:gateway")
  @ApiParam({
    name: "batchNumber",
    type: "integer",
    example: "1",
    description: "Batch number",
  })
  @ApiParam({
    name: "gateway",
    type: "string",
    schema: { pattern: ADDRESS_REGEX_PATTERN },
    example: "0xabe785340e1c1ed3228bc7ec460d2fedd82260a0",
    description: "gateway address",
  })
  @ApiOkResponse({ description: "Batch amount was returned successfully", type: BatchAmountDto })
  @ApiBadRequestResponse({ description: "Batch number or gateway is invalid" })
  @ApiNotFoundResponse({ description: "Can't find batch amount for the specified batch number and gateway" })
  public async getBatchAmount(
    @Param("batchNumber", new ParseLimitedIntPipe({ min: 1 })) batchNumber: number,
    @Param("gateway", new ParseAddressPipe({ errorMessage: "Invalid gateway address" })) gateway: string
  ): Promise<BatchAmountDto> {
    const result = await this.transferService.sumAmount(batchNumber, gateway);
    if (!result) {
      throw new NotFoundException();
    }
    return result[0] ?? null;
  }
}
