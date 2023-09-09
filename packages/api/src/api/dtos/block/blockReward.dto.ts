import { ApiProperty } from "@nestjs/swagger";

export class BlockRewardDto {
  @ApiProperty({
    type: String,
    description: "The number (height) of the block",
    example: "5783999",
  })
  public readonly blockNumber: string;

  @ApiProperty({
    type: String,
    description: "The timestamp of the block",
    example: "1635934428",
  })
  public readonly timeStamp: string;

  @ApiProperty({
    type: String,
    description: "An address that mined the block",
    example: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
  })
  public readonly blockMiner: string;

  @ApiProperty({
    type: String,
    description: "Reward for the block",
    example: "1000",
  })
  public readonly blockReward: string;

  @ApiProperty({
    type: String,
    description: "Uncle blocks",
    example: ["1000", "1001"],
  })
  public readonly uncles: string[];

  @ApiProperty({
    type: String,
    description: "Uncle inclusion reward",
    example: "1000",
  })
  public readonly uncleInclusionReward: string;
}
