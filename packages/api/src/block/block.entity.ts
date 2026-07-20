import { Entity, Column, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { hexTransformer } from "../common/transformers/hex.transformer";

export enum BlockStatus {
  Sealed = "sealed",
  Committed = "committed",
  Proven = "proven",
  Executed = "executed",
}

@Entity({ name: "blocks" })
export class Block extends BaseEntity {
  @PrimaryColumn({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly number: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly hash: string;

  @Column({ type: "timestamp" })
  public readonly timestamp: Date;

  @Column({ type: "varchar", length: 128 })
  public readonly gasUsed: string;

  @Column({ type: "enum", enum: BlockStatus, default: BlockStatus.Sealed })
  public readonly status: BlockStatus;

  @Column({ type: "int" })
  public readonly l1TxCount: number;

  @Column({ type: "int" })
  public readonly l2TxCount: number;

  public get size() {
    return this.l1TxCount + this.l2TxCount;
  }

  toJSON(): any {
    return {
      ...this,
      size: this.size,
    };
  }
}
