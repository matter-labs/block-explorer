import { ApiProperty } from "@nestjs/swagger";

export class AccountMinedBlock {
  @ApiProperty({
    type: String,
    description: "The number (height) of the block",
    example: "3233097",
  })
  public readonly blockNumber: string;

  @ApiProperty({
    type: String,
    description: "The timestamp of the block",
    example: "1679988122",
  })
  public readonly timeStamp: string;

  @ApiProperty({
    type: String,
    description: "Reward for the block",
    example: "1000",
  })
  public readonly blockReward: string;
}
