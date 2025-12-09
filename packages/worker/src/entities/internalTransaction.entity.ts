import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Block } from "./block.entity";
import { Transaction } from "./transaction.entity";
import { hash64HexTransformer } from "../transformers/hash64Hex.transformer";
import { hexTransformer } from "../transformers/hex.transformer";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { CountableEntity } from "./countable.entity";

@Entity({ name: "internalTransactions" })
@Index(["transactionHash"])
@Index(["blockNumber"])
@Index(["from"])
@Index(["to"])
@Index(["traceIndex"])
@Index(["blockNumber", "traceIndex"])
@Index(["transactionHash", "traceAddress"], { unique: true })
export class InternalTransaction extends CountableEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly id: number;

  @ManyToOne(() => Transaction, { onDelete: "CASCADE" })
  @JoinColumn({ name: "transactionHash" })
  private readonly _transaction: never;

  @Column({ type: "bytea", transformer: hash64HexTransformer })
  public readonly transactionHash: string;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockNumber" })
  private readonly _block: never;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly from: string;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly to?: string;

  @Column({ type: "varchar", length: 128 })
  public readonly value: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  public readonly gas?: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  public readonly gasUsed?: string;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly input?: string;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly output?: string;

  @Column({ type: "varchar" })
  public readonly type: string;

  @Column({ type: "varchar", nullable: true })
  public readonly callType?: string;

  @Column({ type: "varchar" })
  public readonly traceAddress: string;

  @Column({ type: "int" })
  public readonly traceIndex: number;

  @Column({ type: "varchar", nullable: true })
  public readonly error?: string;

  @Column({ type: "timestamp" })
  public readonly timestamp: string;
}
