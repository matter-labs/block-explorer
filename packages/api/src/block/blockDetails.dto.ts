import { ApiProperty } from "@nestjs/swagger";
import { BlockDto } from "./block.dto";

export class BlockDetailsDto extends BlockDto {
  @ApiProperty({
    type: String,
    description: "The hash of the previous block",
    required: false,
    example: "0x51f81bcdfc324a0dff2b5bec9d92e21cbebc4d5e29d3a3d30de3e03fbeab8d7f",
    examples: ["0x51f81bcdfc324a0dff2b5bec9d92e21cbebc4d5e29d3a3d30de3e03fbeab8d7f", null],
  })
  public readonly parentHash?: string;

  @ApiProperty({
    type: String,
    description: "The maximum amount of gas that this block was permitted to use",
    example: "100000000",
  })
  public readonly gasLimit: string;

  @ApiProperty({ type: String, description: "Base fee per gas", example: "100000000" })
  public readonly baseFeePerGas: string;

  @ApiProperty({
    type: String,
    description: "Extra data a miner may choose to include when mining a block",
    example: "0x00",
  })
  public readonly extraData: string;

  @ApiProperty({
    type: String,
    description: "Commit transaction hash",
    example: "0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b",
    examples: ["0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b", null],
  })
  public readonly commitTxHash?: string;

  @ApiProperty({
    type: String,
    description: "Execute transaction hash",
    example: "0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b",
    examples: ["0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b", null],
  })
  public readonly executeTxHash?: string;

  @ApiProperty({
    type: String,
    description: "Prove transaction hash",
    example: "0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b",
    examples: ["0x85f97229ef1e489d4a5c2f8c15eb275ee7a6adcdae57d02597221d202b0f421b", null],
  })
  public readonly proveTxHash?: string;

  @ApiProperty({
    type: Date,
    description: "Date when the block was committed",
    example: new Date("2022-09-15T15:13:57.035Z"),
    examples: [new Date("2022-09-15T15:13:57.035Z"), null],
  })
  public readonly committedAt?: Date;

  @ApiProperty({
    type: Date,
    description: "Date when the block was executed",
    example: new Date("2022-09-15T15:13:57.035Z"),
    examples: [new Date("2022-09-15T15:13:57.035Z"), null],
  })
  public readonly executedAt?: Date;

  @ApiProperty({
    type: Date,
    description: "Date when the block was approved",
    example: new Date("2022-09-15T15:13:57.035Z"),
    examples: [new Date("2022-09-15T15:13:57.035Z"), null],
  })
  public readonly provenAt?: Date;
}
