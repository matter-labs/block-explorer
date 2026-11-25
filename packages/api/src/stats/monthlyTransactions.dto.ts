import { ApiProperty } from "@nestjs/swagger";

export class MonthlyTransactionsDto {
  @ApiProperty({ type: Number, description: "Number of transactions that month", example: 12345 })
  public readonly count: number;
}
