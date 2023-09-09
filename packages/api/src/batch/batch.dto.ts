import { ApiProperty } from "@nestjs/swagger";
import { BatchStatus } from "./batch.entity";

export class BatchDto {
  @ApiProperty({ type: Number, description: "The height (number) of the batch", example: 10 })
  public readonly number: number;

  @ApiProperty({
    type: Date,
    description: "The timestamp of the batch",
    example: new Date("2022-11-21T18:16:51.000Z"),
  })
  public readonly timestamp: Date;

  @ApiProperty({
    type: String,
    description: "Root hash of the batch",
    required: false,
    example: "0x1915069f839c80d8bf1df2ba08dc41fbca1fcae62ecf3a148dda013d520a3638",
    examples: ["0x1915069f839c80d8bf1df2ba08dc41fbca1fcae62ecf3a148dda013d520a3638", null],
  })
  public readonly rootHash?: string;

  @ApiProperty({
    type: Date,
    description: "Date when the batch was executed",
    example: new Date("2022-09-15T15:13:57.035Z"),
    examples: [new Date("2022-09-15T15:13:57.035Z"), null],
  })
  public readonly executedAt?: Date;

  @ApiProperty({
    enum: BatchStatus,
    description: "Status of the batch",
    example: "sealed",
    examples: ["sealed", "verified"],
  })
  public readonly status: BatchStatus;

  @ApiProperty({ type: Number, description: "L1 transactions count", example: 10 })
  public readonly l1TxCount: number;

  @ApiProperty({ type: Number, description: "L2 transactions count", example: 10 })
  public readonly l2TxCount: number;

  @ApiProperty({ type: Number, description: "Batch size (number of transaction in the batch)", example: 20 })
  public readonly size: number;
}
