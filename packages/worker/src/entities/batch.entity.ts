import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { hexTransformer } from "../transformers/hex.transformer";
import { BaseEntity } from "./base.entity";

export enum BatchState {
  New = 0,
  Committed = 1,
  Proven = 2,
  Executed = 3,
}

@Entity({ name: "batches" })
@Index(["executedAt", "number"])
@Index(["timestamp", "number"])
export class Batch extends BaseEntity {
  @PrimaryColumn({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly number: number;

  @Index({ unique: true })
  @Column({ type: "bytea", unique: true, nullable: true, transformer: hexTransformer })
  public readonly rootHash?: string;

  @Column({ type: "timestamp" })
  public readonly timestamp: Date;

  @Column({ type: "varchar", length: 128 })
  public readonly l1GasPrice: number;

  @Column({ type: "varchar", length: 128 })
  public readonly l2FairGasPrice: number;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly commitTxHash?: string;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  public readonly committedAt?: Date;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly proveTxHash?: string;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  public readonly provenAt?: Date;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly executeTxHash?: string;

  @Column({ type: "timestamp", nullable: true })
  public readonly executedAt?: Date;

  @Column({ type: "int" })
  public readonly l1TxCount: number;

  @Column({ type: "int" })
  public readonly l2TxCount: number;
}
