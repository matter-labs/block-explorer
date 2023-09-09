import { ApiProperty } from "@nestjs/swagger";

export class BlockCountdownDto {
  @ApiProperty({
    type: String,
    description: "Current block number",
    example: "5783999",
  })
  public readonly CurrentBlock: string;

  @ApiProperty({
    type: String,
    description: "Countdown block number",
    example: "5793995",
  })
  public readonly CountdownBlock: string;

  @ApiProperty({
    type: String,
    description: "The number of blocks to be mined until a certain block is mined",
    example: "9996",
  })
  public readonly RemainingBlock: string;

  @ApiProperty({
    type: String,
    description: "The estimated time remaining, in seconds, until a certain block is mined",
    example: "9996",
  })
  public readonly EstimateTimeInSec: string;
}
