import { ApiProperty } from "@nestjs/swagger";
import { BatchDto } from "./batch.dto";

export class BatchDetailsDto extends BatchDto {
  @ApiProperty({
    type: String,
    description: "Commit transaction hash",
    example: "0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b",
    examples: ["0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b", null],
  })
  public readonly commitTxHash?: string;

  @ApiProperty({
    type: String,
    description: "Prove transaction hash",
    example: "0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b",
    examples: ["0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b", null],
  })
  public readonly proveTxHash?: string;

  @ApiProperty({
    type: String,
    description: "Execute transaction hash",
    example: "0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b",
    examples: ["0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b", null],
  })
  public readonly executeTxHash?: string;

  @ApiProperty({
    type: Date,
    description: "Date when the batch was committed",
    example: new Date("2022-09-15T15:13:57.035Z"),
    examples: [new Date("2022-09-15T15:13:57.035Z"), null],
  })
  public readonly committedAt?: Date;

  @ApiProperty({
    type: Date,
    description: "Date when the batch was proven",
    example: new Date("2022-09-15T15:13:57.035Z"),
    examples: [new Date("2022-09-15T15:13:57.035Z"), null],
  })
  public readonly provenAt?: Date;

  @ApiProperty({
    type: String,
    description: "L1 gas price",
    example: "100000000",
  })
  public readonly l1GasPrice: string;

  @ApiProperty({
    type: String,
    description: "L2 fair gas price",
    example: "100000000",
  })
  public readonly l2FairGasPrice: string;
}
