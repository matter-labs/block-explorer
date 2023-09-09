import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min, Matches } from "class-validator";
import { ADDRESS_REGEX_PATTERN } from "../../common/pipes/parseAddress.pipe";

export class FilterTransactionsOptionsDto {
  @ApiPropertyOptional({
    minimum: 0,
    default: null,
    description: "L1 batch number to filter transactions by",
    example: null,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  public readonly l1BatchNumber?: number;

  @ApiPropertyOptional({
    minimum: 0,
    default: null,
    description: "Block number to filter transactions by",
    example: null,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  public readonly blockNumber?: number;

  @ApiPropertyOptional({
    default: null,
    description: "Address to filter transactions by",
    example: null,
  })
  @Matches(new RegExp(ADDRESS_REGEX_PATTERN), { message: "Address parameter is invalid" })
  @Type(() => String)
  @IsOptional()
  public readonly address?: string;
}
