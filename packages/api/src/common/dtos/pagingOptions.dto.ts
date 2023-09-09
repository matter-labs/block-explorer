import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PagingOptionsDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: "One-based page index to return",
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  public readonly page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 10,
    description: "A number of items to return on a page. The maximum is 100 and is limited by the server.",
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  public readonly limit: number = 10;
}
