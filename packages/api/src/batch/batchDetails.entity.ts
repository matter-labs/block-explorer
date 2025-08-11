import { Entity, Column, Index } from "typeorm";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { Batch } from "./batch.entity";

@Entity({ name: "batches" })
export class BatchDetails extends Batch {
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

  @Column({ type: "varchar", length: 128 })
  public readonly l1GasPrice: string;

  @Column({ type: "varchar", length: 128 })
  public readonly l2FairGasPrice: string;
}
