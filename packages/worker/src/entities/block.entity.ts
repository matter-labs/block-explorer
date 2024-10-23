import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { hash64HexTransformer } from "../transformers/hash64Hex.transformer";
import { hexTransformer } from "../transformers/hex.transformer";
import { Batch } from "./batch.entity";
import { BaseEntity } from "./base.entity";

@Entity({ name: "blocks" })
@Index(["timestamp", "number"])
@Index(["miner", "number"])
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

  @ManyToOne(() => Batch, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: "l1BatchNumber" })
  public batch: Batch;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly l1BatchNumber: number;

  @Column({ type: "int" })
  public readonly l1TxCount: number;

  @Column({ type: "int" })
  public readonly l2TxCount: number;
}
