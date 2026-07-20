import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsInt, Min } from "class-validator";

export class ListFiltersDto {
  @ApiPropertyOptional({
    description: "Filters items with block number greater than or equal to specified value",
    example: 1,
    type: "integer",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  public readonly fromBlock?: number;

  @ApiPropertyOptional({
    description: "Filters items with block number less than or equal to specified value",
    example: 100,
    type: "integer",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  public readonly toBlock?: number;
}
