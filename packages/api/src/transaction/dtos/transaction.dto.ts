import { ApiProperty } from "@nestjs/swagger";
import { TransactionStatus } from "../entities/transaction.entity";

export class TransactionDto {
  @ApiProperty({
    type: String,
    description: "The hash of this transaction",
    example: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
  })
  public readonly hash: string;

  @ApiProperty({
    type: String,
    description: "The address this transaction is to",
    example: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
  })
  public readonly to: string;

  @ApiProperty({
    type: String,
    description: "The address this transaction is from",
    example: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
  })
  public readonly from: string;

  @ApiProperty({
    type: Number,
    description: "The index of the transaction in the block",
    example: 3233097,
  })
  public readonly transactionIndex: number;

  @ApiProperty({
    type: String,
    description: "The data included in this transaction",
    example: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
  })
  public readonly data: string;

  @ApiProperty({
    type: String,
    description: "The amount this transaction sent",
    example: "100000000",
  })
  public readonly value: string;

  @ApiProperty({
    type: String,
    description: "The fee paid to execute the transaction",
    example: "0x2386f26fc10000",
  })
  public readonly fee: string;

  @ApiProperty({
    type: Number,
    description: "The nonce for this transaction",
    example: 42,
  })
  public readonly nonce: number;

  @ApiProperty({
    type: String,
    description: "Gas price",
    example: "100000000",
  })
  public readonly gasPrice: string;

  @ApiProperty({
    type: String,
    description: "Gas limit",
    example: "100000000",
  })
  public readonly gasLimit: string;

  @ApiProperty({
    type: String,
    description: "Gas per pubdata limit",
    example: "100000000",
    examples: ["100000000", null],
    required: false,
  })
  public readonly gasPerPubdata?: string;

  @ApiProperty({
    type: String,
    description: "Max fee per gas",
    example: "100000000",
    examples: ["100000000", null],
    required: false,
  })
  public readonly maxFeePerGas?: string;

  @ApiProperty({
    type: String,
    description: "Max priority fee per gas",
    example: "100000000",
    examples: ["100000000", null],
    required: false,
  })
  public readonly maxPriorityFeePerGas?: string;

  @ApiProperty({
    type: Number,
    description: "The number (height) of the block this transaction was mined in",
    example: 3233097,
  })
  public readonly blockNumber: number;

  @ApiProperty({
    type: String,
    description: "The hash of the block this transaction was mined in",
    example: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
  })
  public readonly blockHash: string;

  @ApiProperty({
    type: Date,
    description: "The timestamp when the transaction was received",
    example: new Date("2022-11-21T18:16:51.000Z"),
  })
  public readonly receivedAt: Date;

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
    type: Boolean,
    description: "Property that shows whether the transaction was originated from L1 network",
    example: true,
    examples: [true, false],
  })
  public readonly isL1Originated: boolean;

  @ApiProperty({
    type: Number,
    description: "L1 batch number",
    example: 3233097,
    examples: [3233097, null],
    nullable: true,
  })
  public readonly l1BatchNumber?: number;

  @ApiProperty({
    type: Boolean,
    description: "Property that shows whether the transaction's L1 batch is already sealed",
    example: true,
    examples: [true, false],
  })
  public readonly isL1BatchSealed: boolean;

  @ApiProperty({
    type: Number,
    description: "The type of the transaction",
    example: 255,
  })
  public readonly type: number;

  @ApiProperty({
    enum: TransactionStatus,
    description: "The status of the transaction",
    example: "verified",
    examples: ["included", "committed", "proved", "verified", "failed"],
  })
  public readonly status: TransactionStatus;

  @ApiProperty({
    type: String,
    description: "Transaction error",
    example: "Some test error",
    examples: ["Some test error", null],
    nullable: true,
  })
  public readonly error?: string;

  @ApiProperty({
    type: String,
    description: "Transaction revert reason",
    example: "Some test revert reason",
    examples: ["Some test revert reason", null],
    nullable: true,
  })
  public readonly revertReason?: string;
}
