import { Controller, Get, Param, NotFoundException, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiExcludeController,
} from "@nestjs/swagger";
import { Pagination } from "nestjs-typeorm-paginate";
import { ParseLimitedIntPipe } from "../common/pipes/parseLimitedInt.pipe";
import { PagingOptionsDto, ListFiltersDto } from "../common/dtos";
import { buildDateFilter } from "../common/utils";
import { ApiListPageOkResponse } from "../common/decorators/apiListPageOkResponse";
import { BatchService } from "./batch.service";
import { BatchDto } from "./batch.dto";
import { BatchDetailsDto } from "./batchDetails.dto";
import { swagger } from "../config/featureFlags";

const entityName = "batches";

@ApiTags("Batch BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

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
}
