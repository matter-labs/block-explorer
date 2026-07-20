import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { hash64HexTransformer } from "../transformers/hash64Hex.transformer";
import { hexTransformer } from "../transformers/hex.transformer";
import { BaseEntity } from "./base.entity";

export enum BlockStatus {
  Sealed = "sealed",
  Committed = "committed",
  Proven = "proven",
  Executed = "executed",
}

@Entity({ name: "blocks" })
@Index(["timestamp", "number"])
@Index(["miner", "number"])
@Index(["status", "number"])
export class Block extends BaseEntity {
  @PrimaryColumn({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly number: number;

  @Index({ unique: true })
  @Column({ type: "bytea", unique: true, transformer: hexTransformer })
  public readonly hash: string;

  @Column({ type: "bytea", nullable: true, transformer: hash64HexTransformer })
  public readonly parentHash?: string;

  @Column({ type: "timestamp" })
  public readonly timestamp: Date;

  @Column({ type: "varchar" })
  public readonly nonce: string;

  @Column({ type: "int" })
  public readonly difficulty: bigint;

  @Column({ type: "varchar", length: 128 })
  public readonly gasLimit: string;

  @Column({ type: "varchar", length: 128 })
  public readonly gasUsed: string;

  @Column({ type: "varchar", length: 128 })
  public readonly baseFeePerGas: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly miner: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly extraData: string;

  @Column({ type: "enum", enum: BlockStatus, default: BlockStatus.Sealed })
  public readonly status: BlockStatus;

  @Column({ type: "int" })
  public readonly l1TxCount: number;

  @Column({ type: "int" })
  public readonly l2TxCount: number;
}
