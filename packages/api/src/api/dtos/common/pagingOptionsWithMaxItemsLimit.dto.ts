import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { MaxItemsLimit } from "../../decorators/maxItemsLimit";
import { PagingOptionsDto } from "./pagingOptions.dto";
import { config } from "dotenv";
config();

const maxItemsLimit = parseInt(process.env.API_LIMITED_PAGINATION_MAX_ITEMS, 10) || 1000;

export class PagingOptionsWithMaxItemsLimitDto extends PagingOptionsDto {
  @ApiPropertyOptional({
    type: "integer",
    minimum: 1,
    default: 1,
    description: `The page number. Only first ${maxItemsLimit} items can be requested so make sure page * offset <= ${maxItemsLimit}.`,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  @MaxItemsLimit(maxItemsLimit, {
    message: `Result window is too large, PageNo x Offset size must be less than or equal to ${maxItemsLimit}`,
  })
  public readonly page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(maxItemsLimit)
  @Max(maxItemsLimit)
  public readonly maxLimit: number = maxItemsLimit;
}
