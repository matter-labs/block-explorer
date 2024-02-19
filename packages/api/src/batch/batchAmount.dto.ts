import { ApiProperty } from "@nestjs/swagger";

export class BatchAmountDto {
  @ApiProperty({
    type: String,
    description: "Batch number",
    example: "261",
  })
  public readonly batchNumber: string;

  @ApiProperty({
    type: String,
    description: "Gateway address",
    example: "0xabe785340e1c1ed3228bc7ec460d2fedd82260a0",
  })
  public readonly gateway: string;

  @ApiProperty({
    type: String,
    description: "Sum of the amounts of all transactions in the batch and the gateway address",
    example: "1400000000000000",
  })
  public readonly amount: string;
}
