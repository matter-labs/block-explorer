import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { MaxItemsLimit } from "../decorators/maxItemsLimit";
import { PagingOptionsDto } from "./pagingOptions.dto";
import { config } from "dotenv";
config();

const maxItemsLimit = parseInt(process.env.LIMITED_PAGINATION_MAX_ITEMS, 10) || 10000;

export class PagingOptionsWithMaxItemsLimitDto extends PagingOptionsDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: `One-based page index to return. Only first ${maxItemsLimit} items can be requested so make sure page * limit <= ${maxItemsLimit}.`,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  @MaxItemsLimit(maxItemsLimit, {
    message: `Only first ${maxItemsLimit} items can be requested.`,
  })
  public readonly page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(maxItemsLimit)
  @Max(maxItemsLimit)
  public readonly maxLimit: number = maxItemsLimit;
}
