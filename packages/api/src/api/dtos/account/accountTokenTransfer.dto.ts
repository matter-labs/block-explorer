import { ApiProperty } from "@nestjs/swagger";

export class AccountTokenTransferDto {
  @ApiProperty({
    type: String,
    description: "The hash of parent transaction",
    example: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
  })
  public readonly hash: string;

  @ApiProperty({
    type: String,
    description: "The to address of this transfer",
    example: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
  })
  public readonly to: string;

  @ApiProperty({
    type: String,
    description: "The from address of this transfer",
    example: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
  })
  public readonly from: string;

  @ApiProperty({
    type: String,
    description: "The index of the parent transaction in the block",
    example: "3233097",
  })
  public readonly transactionIndex: string;

  @ApiProperty({
    type: String,
    description: "The data included in parent transaction",
    example: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
  })
  public readonly input: string;

  @ApiProperty({
    type: String,
    description: "The value of this transfer",
    example: "10000000000000000",
  })
  public readonly value: string;

  @ApiProperty({
    type: String,
    description: "Gas limit",
    example: "10000000000000000",
  })
  public readonly gas: string;

  @ApiProperty({
    type: String,
    description: "Gas price",
    example: "10000000000000000",
  })
  public readonly gasPrice: string;

  @ApiProperty({
    type: String,
    description: "Gas used by parent transaction",
    example: "10000000000000000",
  })
  public readonly gasUsed: string;

  @ApiProperty({
    type: String,
    description: "Cumulative gas used",
    example: "10000000000000000",
  })
  public readonly cumulativeGasUsed: string;

  @ApiProperty({
    type: String,
    description: "The fee paid to execute parent transaction",
    example: "10000000000000000",
  })
  public readonly fee: string;

  @ApiProperty({
    type: String,
    description: "The nonce for parent transaction",
    example: "42",
  })
  public readonly nonce: string;

  @ApiProperty({
    type: String,
    description: "Number of confirmations",
    example: "100",
  })
  public readonly confirmations: string;

  @ApiProperty({
    type: String,
    description: "The number (height) of the block the parent transaction was mined in",
    example: "3233097",
  })
  public readonly blockNumber: string;

  @ApiProperty({
    type: String,
    description: "The hash of the block the parent transaction was mined in",
    example: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
  })
  public readonly blockHash: string;

  @ApiProperty({
    type: String,
    description: "L1 batch number",
    example: "3233097",
  })
  public readonly l1BatchNumber: string;

  @ApiProperty({
    type: String,
    description: "The timestamp when the parent transaction was received",
    example: "1679988122",
  })
  public readonly timeStamp: string;

  @ApiProperty({
    type: String,
    description: "Token contract address",
    example: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
    nullable: true,
  })
  public readonly contractAddress: string;

  @ApiProperty({
    type: String,
    description: "Token name",
    example: "Token",
  })
  public readonly tokenName: string;

  @ApiProperty({
    type: String,
    description: "Token symbol",
    example: "TKN",
  })
  public readonly tokenSymbol: string;

  @ApiProperty({
    type: String,
    description: "Token decimals",
    example: "18",
  })
  public readonly tokenDecimal: string;

  @ApiProperty({
    type: String,
    description: "The type of the parent transaction",
    example: "255",
  })
  public readonly transactionType: string;
}

export class AccountNFTTransferDto extends AccountTokenTransferDto {
  @ApiProperty({
    type: String,
    description: "Token Id",
    example: "123",
  })
  public readonly tokenID: string;
}
