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
import { buildDateFilter } from "../common/utils";
import { ParseLimitedIntPipe } from "../common/pipes/parseLimitedInt.pipe";
import { PagingOptionsDto, ListFiltersDto } from "../common/dtos";
import { ApiListPageOkResponse } from "../common/decorators/apiListPageOkResponse";
import { BlockService } from "./block.service";
import { BlockDto } from "./block.dto";
import { BlockDetailsDto } from "./blockDetails.dto";
import { swagger } from "../config/featureFlags";

const entityName = "blocks";

@ApiTags("Block BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get("")
  @ApiListPageOkResponse(BlockDto, { description: "Successfully returned blocks list" })
  @ApiBadRequestResponse({ description: "Query params are not valid or out of range" })
  public async getBlocks(
    @Query() listFilterOptions: ListFiltersDto,
    @Query() pagingOptions: PagingOptionsDto
  ): Promise<Pagination<BlockDto>> {
    const filterCriteria = buildDateFilter(listFilterOptions.fromDate, listFilterOptions.toDate);
    return await this.blockService.findAll(filterCriteria, {
      filterOptions: listFilterOptions,
      ...pagingOptions,
      route: entityName,
      canUseNumberFilterAsOffset: true,
    });
  }

  @Get(":blockNumber")
  @ApiParam({
    name: "blockNumber",
    type: "integer",
    example: "1",
    description: "Block number",
  })
  @ApiOkResponse({ description: "Block was returned successfully", type: BlockDetailsDto })
  @ApiBadRequestResponse({ description: "Block number is invalid" })
  @ApiNotFoundResponse({ description: "Block with the specified number does not exist" })
  public async getBlock(
    @Param("blockNumber", new ParseLimitedIntPipe({ min: 0 })) blockNumber: number
  ): Promise<BlockDetailsDto> {
    const block = await this.blockService.findOne(blockNumber);
    if (!block) {
      throw new NotFoundException();
    }
    return block;
  }
}
