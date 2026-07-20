import { ApiProperty } from "@nestjs/swagger";

export class MonthlyActiveAddressDto {
  @ApiProperty({ type: Number, description: "Number of unique sender addresses that month", example: 12345 })
  public readonly count: number;
}
