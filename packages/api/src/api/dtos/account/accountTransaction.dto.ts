import { ApiProperty } from "@nestjs/swagger";

export class AccountTransactionDto {
  @ApiProperty({
    type: String,
    description: "The hash of this transaction",
    example: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
  })
  public readonly hash: string;

  @ApiProperty({
    type: String,
    description: "The to address of this transaction",
    example: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
  })
  public readonly to: string;

  @ApiProperty({
    type: String,
    description: "The from address of this transaction",
    example: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
  })
  public readonly from: string;

  @ApiProperty({
    type: String,
    description: "The index of the transaction in the block",
    example: "3233097",
  })
  public readonly transactionIndex: string;

  @ApiProperty({
    type: String,
    description: "The data included in this transaction",
    example: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
  })
  public readonly input: string;

  @ApiProperty({
    type: String,
    description: "The value of this transaction",
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
    description: "Gas used by this transaction",
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
    description: "The fee paid to execute this transaction",
    example: "10000000000000000",
  })
  public readonly fee: string;

  @ApiProperty({
    type: String,
    description: "The nonce for this transaction",
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
    description: "The number (height) of the block this transaction was mined in",
    example: "3233097",
  })
  public readonly blockNumber: string;

  @ApiProperty({
    type: String,
    description: "The hash of the block this transaction was mined in",
    example: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
  })
  public readonly blockHash: string;

  @ApiProperty({
    type: String,
    description: "The timestamp when the transaction was received",
    example: "1679988122",
  })
  public readonly timeStamp: string;

  @ApiProperty({
    type: String,
    description: "The hash of the transaction that committed the block, null if not committed yet",
    example: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
    examples: ["0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c", null],
    nullable: true,
  })
  public readonly commitTxHash?: string;

  @ApiProperty({
    type: String,
    description: "The hash of the transaction that proved the block, null if not proved yet",
    example: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
    examples: ["0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c", null],
    nullable: true,
  })
  public readonly proveTxHash?: string;

  @ApiProperty({
    type: String,
    description: "The hash of the transaction that executed the block, null if not executed yet",
    example: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
    examples: ["0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c", null],
    nullable: true,
  })
  public readonly executeTxHash?: string;

  @ApiProperty({
    type: String,
    description: "Property that shows whether the transaction was originated from L1 network",
    example: "1",
    examples: ["1", "0"],
  })
  public readonly isL1Originated: string;

  @ApiProperty({
    type: String,
    description: "L1 batch number",
    example: "3233097",
  })
  public readonly l1BatchNumber: string;

  @ApiProperty({
    type: String,
    description: "Contract address",
    example: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
    nullable: true,
  })
  public readonly contractAddress?: string;

  @ApiProperty({
    type: String,
    description: "Returns 0 for successful transactions and 1 for failed transactions",
    example: "0",
  })
  public readonly isError: string;

  @ApiProperty({
    type: String,
    description: "Status code of this transaction execution",
    example: "1",
  })
  public readonly txreceipt_status: string;

  @ApiProperty({
    type: String,
    description: "Method Id",
    example: "0xa9059cbb",
  })
  public readonly methodId: string;

  @ApiProperty({
    type: String,
    description: "Function name",
    example: "transfer(address to, uint256 tokens)",
  })
  public readonly functionName: string;

  @ApiProperty({
    type: String,
    description: "The type of the transaction",
    example: "255",
  })
  public readonly type: string;
}
