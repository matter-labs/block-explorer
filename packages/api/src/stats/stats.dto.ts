import { ApiProperty } from "@nestjs/swagger";

export class StatsDto {
  @ApiProperty({ type: Number, description: "The number of the last sealed batch", example: 20 })
  public readonly lastSealedBatch: number;

  @ApiProperty({ type: Number, description: "The number of the last verified batch", example: 10 })
  public readonly lastVerifiedBatch: number;

  @ApiProperty({ type: Number, description: "The number of the last sealed block", example: 20 })
  public readonly lastSealedBlock: number;

  @ApiProperty({ type: Number, description: "The number of the last verified block", example: 10 })
  public readonly lastVerifiedBlock: number;

  @ApiProperty({ type: Number, description: "The total number of processed transactions", example: 30 })
  public readonly totalTransactions: number;
}
