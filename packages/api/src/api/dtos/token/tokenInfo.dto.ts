import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class TokenInfoDto {
  @ApiProperty({
    type: String,
    description: "Token contract address",
    example: "0x000000000000000000000000000000000000800A",
  })
  public readonly contractAddress: string;

  @ApiProperty({
    type: String,
    description: "Token name",
    example: "Ether",
  })
  public readonly tokenName: string;

  @ApiProperty({
    type: String,
    description: "Token symbol",
    example: "ETH",
  })
  public readonly symbol: string;

  @ApiProperty({
    type: String,
    description: "Token decimals",
    example: "18",
  })
  public readonly tokenDecimal: string;

  @ApiProperty({
    type: String,
    description: "Token price in USD",
    example: "1823.567",
  })
  public readonly tokenPriceUSD: string;

  @ApiProperty({
    type: String,
    description: "Token liquidity in USD",
    example: "220000000000",
  })
  public readonly liquidity: string;

  @ApiProperty({
    type: String,
    description: "Token L1 address",
    example: "0x0000000000000000000000000000000000000000",
  })
  public readonly l1Address: string;

  @ApiProperty({
    type: String,
    description: "Token icon URL",
    example: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
  })
  public readonly iconURL: string;
}

export class TokenInfoResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "Token info",
    type: TokenInfoDto,
    isArray: true,
  })
  public readonly result: TokenInfoDto[];
}
