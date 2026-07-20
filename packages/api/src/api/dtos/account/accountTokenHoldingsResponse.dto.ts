import { ApiProperty } from "@nestjs/swagger";
import { ResponseBaseDto } from "../common/responseBase.dto";

export class TokenInfoBalanceDto {
  @ApiProperty({
    description: "Token's address",
    example: "0x000000000000000000000000000000000000800A",
  })
  public readonly TokenAddress: string;
  @ApiProperty({
    description: "Token's name",
    example: "Ethereum",
  })
  public readonly TokenName: string;
  @ApiProperty({
    description: "Token's symbol",
    example: "ETH",
  })
  public readonly TokenSymbol: string;
  @ApiProperty({
    description: "The account's token balance",
    example: "1861606940000000000",
  })
  public readonly TokenQuantity: string;
  @ApiProperty({
    description: "Token's divisor",
    example: "18",
  })
  public readonly TokenDivisor: string;
}

export class AccountTokenHoldingsResponseDto extends ResponseBaseDto {
  @ApiProperty({
    description: "The account's token holdings",
    example: [
      {
        TokenAddress: "0x000000000000000000000000000000000000800A",
        TokenName: "Ethereum",
        TokenSymbol: "ETH",
        TokenQuantity: "1861606940000000000",
        TokenDivisor: "18",
      },
    ],
  })
  public readonly result: TokenInfoBalanceDto[];
}
