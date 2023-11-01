import { ApiProperty } from "@nestjs/swagger";

export class AccountInternalTransactionDto {
  @ApiProperty({
    type: String,
    description: "The hash of parent transaction",
    example: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
  })
  public readonly hash: string;

  @ApiProperty({
    type: String,
    description: "The to address of this internal transaction",
    example: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
  })
  public readonly to: string;

  @ApiProperty({
    type: String,
    description: "The from address of this internal transaction",
    example: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
  })
  public readonly from: string;

  @ApiProperty({
    type: String,
    description: "The data included in this internal transaction",
    example: "",
  })
  public readonly input: string;

  @ApiProperty({
    type: String,
    description: "The value of this internal transaction",
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
    description: "Gas used by parent transaction",
    example: "10000000000000000",
  })
  public readonly gasUsed: string;

  @ApiProperty({
    type: String,
    description: "The fee paid to execute parent transaction",
    example: "10000000000000000",
  })
  public readonly fee: string;

  @ApiProperty({
    type: String,
    description: "The number (height) of the block the parent transaction was mined in",
    example: "3233097",
  })
  public readonly blockNumber: string;

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
    description: "Contract address",
    example: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
    nullable: true,
  })
  public readonly contractAddress: string;

  @ApiProperty({
    type: String,
    description: "Internal transaction type",
    example: "call",
  })
  public readonly type: string;

  @ApiProperty({
    type: String,
    description: "Trace id of the internal transaction",
    example: "0",
  })
  public readonly traceId: string;

  @ApiProperty({
    type: String,
    description: "Returns 0 for successful transactions and 1 for failed transactions",
    example: "0",
  })
  public readonly isError: string;

  @ApiProperty({
    type: String,
    description: "Error code for failed transaction",
    example: "",
  })
  public readonly errCode: string;

  @ApiProperty({
    type: String,
    description: "The type of the parent transaction",
    example: "255",
  })
  public readonly transactionType: string;
}
