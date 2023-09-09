import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { IsISODateString } from "../decorators/isISODateString";

export class ListFiltersDto {
  @ApiPropertyOptional({
    description: "A date in JSON format. Filters items with timestamp greater or equal to specified",
    example: "2020-04-25T00:43:26.000Z",
  })
  @Type(() => String)
  @IsISODateString()
  @IsOptional()
  public readonly fromDate: string;

  @ApiPropertyOptional({
    description: "A date in JSON format. Filters items with timestamp less than specified",
    example: "2025-04-26T00:43:26.000Z",
  })
  @Type(() => String)
  @IsISODateString()
  @IsOptional()
  public readonly toDate: string;
}
