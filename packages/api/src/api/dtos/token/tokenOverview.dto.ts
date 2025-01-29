import { ApiProperty } from "@nestjs/swagger";

export class TokenOverviewDto {
  @ApiProperty({ type: Number, description: "Number of holders", example: "300" })
  public readonly holders: number;

  @ApiProperty({
    type: Number,
    description: "Total supply",
    example: "1000000000000000000000000000",
  })
  public readonly maxTotalSupply: number;
}
