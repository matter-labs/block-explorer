import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { SortingOrder } from "../../../common/types";

export class PagingOptionsDto {
  @ApiPropertyOptional({
    type: "integer",
    minimum: 1,
    default: 1,
    description: "The page number",
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  public readonly page: number = 1;

  @ApiPropertyOptional({
    type: "integer",
    minimum: 1,
    maximum: 10000,
    default: 10,
    description: "The number of items returned per page",
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  @IsOptional()
  public readonly offset: number = 10;

  @ApiPropertyOptional({
    enum: SortingOrder,
    default: SortingOrder.Desc,
    description: "The sorting preference, use asc to sort by ascending and desc to sort by descending",
    example: SortingOrder.Desc,
  })
  @IsOptional()
  public readonly sort: SortingOrder = SortingOrder.Desc;
}
