import { ApiProperty } from "@nestjs/swagger";

export class TokenDto {
  @ApiProperty({ type: String, description: "L2 token address", example: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8" })
  public readonly l2Address: string;

  @ApiProperty({
    type: String,
    description: "L1 token address",
    example: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
    examples: ["0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8", null],
    required: false,
  })
  public readonly l1Address?: string;

  @ApiProperty({
    type: String,
    description: "Token symbol",
    example: "ABCD",
  })
  public readonly symbol: string;

  @ApiProperty({
    type: String,
    description: "Token name",
    example: "ABCD ERC20 token",
    examples: ["ABCD ERC20 token", null],
    required: false,
  })
  public readonly name?: string;

  @ApiProperty({ type: Number, description: "Token decimals value", example: 18 })
  public readonly decimals: number;
}
