import { Entity, Column, PrimaryColumn, JoinColumn, ManyToOne, Index } from "typeorm";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { hexTransformer } from "../transformers/hex.transformer";
import { Batch } from "./batch.entity";
import { Block } from "./block.entity";
import { CountableEntity } from "./countable.entity";
import { stringTransformer } from "../transformers/string.transformer";

@Entity({ name: "transactions" })
@Index(["receivedAt", "transactionIndex"])
@Index(["l1BatchNumber", "receivedAt", "transactionIndex"])
@Index(["blockNumber", "receivedAt", "transactionIndex"])
@Index(["from", "isL1Originated", "l1BatchNumber", "nonce"])
export class Transaction extends CountableEntity {
  @PrimaryColumn({ type: "bytea", transformer: hexTransformer })
  public readonly hash: string;

  @Index()
  @Column({ generated: true, type: "bigint" })
  public override readonly number: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly to: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly from: string;

  @Column({ type: "bigint" })
  public readonly nonce: number;

  @Column({ type: "int" })
  public readonly transactionIndex: number;

  @Column({ type: "varchar", length: 128 })
  public readonly gasLimit: string;

  @Column({ type: "varchar", length: 128 })
  public readonly gasPrice: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  public readonly maxFeePerGas?: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  public readonly maxPriorityFeePerGas?: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly data: string;

  @Column({ type: "varchar", length: 128 })
  public readonly value: string;

  @Column({ type: "int" })
  public readonly chainId: bigint;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockNumber" })
  private readonly _block: never;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public override readonly blockNumber: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly blockHash: string;

  @Column({ type: "int" })
  public readonly type: number;

  @Column({ type: "jsonb", nullable: true })
  public readonly accessList?: any;

  @ManyToOne(() => Batch, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: "l1BatchNumber" })
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly l1BatchNumber: number;

  @Column({ type: "varchar" })
  public readonly fee: string;

  @Column({ type: "varchar", nullable: true })
  public readonly gasPerPubdata: string;

  @Column({ type: "boolean" })
  public readonly isL1Originated: boolean;

  @Column({ type: "timestamp" })
  public readonly receivedAt: string;

  @Column({ type: "int", default: 1 })
  public readonly receiptStatus: number;

  @Column({ nullable: true, transformer: stringTransformer })
  public readonly error?: string;

  @Column({ nullable: true, transformer: stringTransformer })
  public readonly revertReason?: string;
}
