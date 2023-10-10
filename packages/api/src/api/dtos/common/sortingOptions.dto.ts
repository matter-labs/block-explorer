import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { SortingOrder } from "../../../common/types";

export class SortingOptionsDto {
  @ApiPropertyOptional({
    enum: SortingOrder,
    default: SortingOrder.Desc,
    description: "The sorting preference, use asc to sort by ascending and desc to sort by descending",
    example: SortingOrder.Desc,
  })
  @IsOptional()
  public readonly sort: SortingOrder = SortingOrder.Desc;
}
