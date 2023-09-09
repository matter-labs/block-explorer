import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { BatchDetails } from "../batch/batchDetails.entity";
import { BatchStatus } from "../batch/batch.entity";

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

  @ManyToOne(() => BatchDetails)
  @JoinColumn({ name: "l1BatchNumber" })
  public batch: BatchDetails;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly l1BatchNumber: number;

  @Column({ type: "int" })
  public readonly l1TxCount: number;

  @Column({ type: "int" })
  public readonly l2TxCount: number;

  public get size() {
    return this.l1TxCount + this.l2TxCount;
  }

  public get status(): BatchStatus {
    return this.batch ? this.batch.status : BatchStatus.Sealed;
  }

  public get isL1BatchSealed(): boolean {
    return !!this.batch;
  }

  toJSON(): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { batch, ...restFields } = this;
    return {
      ...restFields,
      size: this.size,
      status: this.status,
      isL1BatchSealed: this.isL1BatchSealed,
    };
  }
}
