import { ApiProperty } from "@nestjs/swagger";
import { TokenDto } from "../token/token.dto";
import { TransferType } from "./transfer.entity";

export class TransferDto {
  @ApiProperty({
    type: String,
    description: "Transfer sender address",
    example: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
  })
  public readonly from: string;

  @ApiProperty({
    type: String,
    description: "Transfer receiver address",
    example: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
  })
  public readonly to: string;

  @ApiProperty({
    type: Number,
    description: "The block height (number) of the block that includes this transfer",
    example: 3233097,
  })
  public readonly blockNumber: number;

  @ApiProperty({
    type: String,
    description: "The transaction hash of the transaction of this transfer. Null if it was a block transfer",
    example: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
    examples: ["0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0", null],
    nullable: true,
  })
  public readonly transactionHash?: string;

  @ApiProperty({
    type: String,
    description:
      "The total amount that was transferred. Null if no amount was specified for the transfer like with NFT tokens",
    example: "100000000",
    examples: ["100000000", null],
    nullable: true,
  })
  public readonly amount?: string;

  @ApiProperty({
    type: TokenDto,
    description: "Token record for the corresponding transfer. Null if token is not ERC20-like",
    nullable: true,
  })
  public readonly token?: TokenDto;

  @ApiProperty({
    type: String,
    description:
      "The address of the token that was transferred (same as token.l2Address). 0x000000000000000000000000000000000000800a for ETH",
    example: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
  })
  public readonly tokenAddress: string;

  @ApiProperty({
    enum: TransferType,
    description: "The type of the transfer",
    example: "transfer",
    examples: ["deposit", "transfer", "withdrawal", "fee", "mint", "refund"],
  })
  public readonly type: TransferType;

  @ApiProperty({
    type: Date,
    description: "The timestamp when the transfer was created",
    example: new Date("2022-11-21T18:16:51.000Z"),
  })
  public readonly timestamp: Date;

  @ApiProperty({
    type: Object,
    additionalProperties: { type: "string" },
    description:
      "Additional transfer fields that depend on the particular transfer. For instance: { tokenId: number } for NFT",
    example: {
      tokenId: 1,
    },
    examples: [
      {
        tokenId: 1,
      },
      null,
    ],
    nullable: true,
  })
  public readonly fields?: Record<string, string>;
}
