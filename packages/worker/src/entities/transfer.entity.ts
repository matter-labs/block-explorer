import { Entity, Column, ManyToOne, JoinColumn, Index, PrimaryColumn } from "typeorm";
import { CountableEntity } from "./countable.entity";
import { Block } from "./block.entity";
import { Transaction } from "./transaction.entity";
import { TokenType } from "./token.entity";
import { hash64HexTransformer } from "../transformers/hash64Hex.transformer";
import { hexTransformer } from "../transformers/hex.transformer";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { TransferFields } from "../dataFetcher/types";

export enum TransferType {
  Deposit = "deposit",
  Transfer = "transfer",
  Withdrawal = "withdrawal",
  Fee = "fee",
  Mint = "mint",
  Refund = "refund",
}

@Entity({ name: "transfers" })
@Index(["transactionHash", "timestamp", "logIndex"])
@Index(["tokenAddress", "isFeeOrRefund", "timestamp", "logIndex"])
@Index(["tokenAddress", "blockNumber", "logIndex"])
@Index(["transactionHash", "isInternal", "blockNumber", "logIndex"])
@Index(["isInternal", "blockNumber", "logIndex"])
export class Transfer extends CountableEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public override readonly number: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly from: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly to: string;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockNumber" })
  private readonly _block: never;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public override readonly blockNumber: number;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transactionHash" })
  private readonly _transaction: never;

  @Column({ type: "bytea", nullable: true, transformer: hash64HexTransformer })
  public readonly transactionHash?: string;

  @Column({ type: "timestamp" })
  public readonly timestamp: string;

  @Column({ type: "int" })
  public readonly transactionIndex: number;

  @Column({ type: "varchar", length: 128, nullable: true })
  public readonly amount?: string;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly tokenAddress?: string;

  @Column({ type: "enum", enum: TransferType, default: TransferType.Transfer })
  public readonly type: TransferType;

  @Column({ type: "enum", enum: TokenType, default: TokenType.ETH })
  public readonly tokenType: TokenType;

  @Column({ type: "boolean" })
  public readonly isFeeOrRefund: boolean;

  @Column({ type: "jsonb", nullable: true })
  public readonly fields?: TransferFields;

  @Column({ type: "int" })
  public readonly logIndex: number;

  @Column({ type: "boolean", default: false })
  public readonly isInternal: boolean;
}
