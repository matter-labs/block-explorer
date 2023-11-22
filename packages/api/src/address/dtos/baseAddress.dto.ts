import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { TokenDto } from "../../token/token.dto";

export enum AddressType {
  Account = "account",
  Contract = "contract",
}

export class TokenAddressDto {
  @ApiProperty({
    type: String,
    description: "Token balance",
    example: "99145500",
  })
  public readonly balance: string;

  @ApiProperty({
    type: TokenDto,
    description: "Token record for the corresponding balance. Null if token is not ERC20-like",
    nullable: true,
  })
  public readonly token?: TokenDto;
}

export class BaseAddressDto {
  @ApiProperty({
    type: String,
    description: "Blockchain address",
    example: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
  })
  public readonly address: string;

  @ApiProperty({
    type: Number,
    description: "The number of the latest block affected the address balances",
    example: 12345,
  })
  public readonly blockNumber: number;

  @ApiProperty({
    type: Object,
    additionalProperties: { $ref: getSchemaPath(TokenAddressDto) },
    description: "Token address to token balance map",
    example: {
      "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8": {
        balance: "100000000",
        token: {
          l2Address: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
          l1Address: null,
          symbol: "symbol",
          name: "Token name",
          decimals: 18,
          usdPrice: 1.0001,
          liquidity: 1000000,
          iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
        },
      },
      "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d9": {
        balance: "300000045",
        token: {
          l2Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d9",
          l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
          symbol: "symbol 2",
          name: "Token name 2",
          decimals: 18,
          usdPrice: 1.0001,
          liquidity: 1000000,
          iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
        },
      },
    },
  })
  public readonly balances: Record<string, TokenAddressDto>;
}
