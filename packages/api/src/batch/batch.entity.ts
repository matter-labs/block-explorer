import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { BaseEntity } from "../common/entities/base.entity";

export enum BatchStatus {
  Sealed = "sealed",
  Verified = "verified",
}

@Entity({ name: "batches" })
export class Batch extends BaseEntity {
  @PrimaryColumn({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly number: number;

  @Column({ type: "timestamp" })
  public readonly timestamp: Date;

  @Index({ unique: true })
  @Column({ type: "bytea", unique: true, nullable: true, transformer: hexTransformer })
  public readonly rootHash?: string;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  public readonly executedAt?: Date;

  @Column({ type: "int" })
  public readonly l1TxCount: number;

  @Column({ type: "int" })
  public readonly l2TxCount: number;

  public get size() {
    return this.l1TxCount + this.l2TxCount;
  }

  public get status() {
    return this.executedAt ? BatchStatus.Verified : BatchStatus.Sealed;
  }

  // Include getters so the fields are included in responses
  toJSON() {
    return {
      ...this,
      size: this.size,
      status: this.status,
    };
  }
}
