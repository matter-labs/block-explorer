import { Entity, Column, PrimaryColumn, Index, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { normalizeAddressTransformer } from "../../common/transformers/normalizeAddress.transformer";
import { bigIntNumberTransformer } from "../../common/transformers/bigIntNumber.transformer";
import { hexTransformer } from "../../common/transformers/hex.transformer";
import { hexToDecimalNumberTransformer } from "../../common/transformers/hexToDecimalNumber.transformer";
import { TransactionReceipt } from "./transactionReceipt.entity";
import { Transfer } from "../../transfer/transfer.entity";
import { Block } from "../../block/block.entity";
import { BatchDetails } from "../../batch/batchDetails.entity";

export enum TransactionStatus {
  Included = "included",
  Committed = "committed",
  Proved = "proved",
  Verified = "verified",
  Failed = "failed",
}

@Entity({ name: "transactions" })
@Index(["blockNumber", "transactionIndex"])
export class Transaction extends BaseEntity {
  @PrimaryColumn({ type: "bytea", transformer: hexTransformer })
  public readonly hash: string;

  @ManyToOne(() => TransactionReceipt, { createForeignKeyConstraints: false })
  @JoinColumn({ name: "hash" })
  public readonly transactionReceipt: TransactionReceipt;

  @Index()
  @Column({ generated: true, type: "bigint" })
  public number: number;

  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly to: string;

  @Index()
  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly from: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly data: string;

  @Column({ type: "varchar", length: 128 })
  public readonly value: string;

  @Column({ type: "boolean" })
  public readonly isL1Originated: boolean;

  @Column({ type: "int", default: 1 })
  public readonly receiptStatus: number;

  @Column({ type: "varchar" })
  public readonly fee: string;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly nonce: number;

  @Column({ type: "varchar", length: 128 })
  public readonly gasLimit: string;

  @Column({ type: "varchar", length: 128 })
  public readonly gasPrice: string;

  @Column({ type: "varchar", length: 128, nullable: true, transformer: hexToDecimalNumberTransformer })
  public readonly gasPerPubdata?: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  public readonly maxFeePerGas?: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  public readonly maxPriorityFeePerGas?: string;

  @ManyToOne(() => Block)
  @JoinColumn({ name: "blockNumber" })
  public readonly block: Block;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @ManyToOne(() => BatchDetails)
  @JoinColumn({ name: "l1BatchNumber" })
  public batch: BatchDetails;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly l1BatchNumber: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly blockHash: string;

  @Column({ type: "int" })
  public readonly type: number;

  @Column({ type: "int" })
  public readonly transactionIndex: number;

  @Column({ type: "timestamp" })
  public readonly receivedAt: Date;

  @OneToMany(() => Transfer, (transfer) => transfer.transaction)
  public readonly transfers: Transfer[];

  @Column({ nullable: true })
  public readonly error?: string;

  @Column({ nullable: true })
  public readonly revertReason?: string;

  public get status(): TransactionStatus {
    if (this.receiptStatus === 0) {
      return TransactionStatus.Failed;
    }
    if (this.batch) {
      if (this.batch.executeTxHash) {
        return TransactionStatus.Verified;
      }
      if (this.batch.proveTxHash) {
        return TransactionStatus.Proved;
      }
      if (this.batch.commitTxHash) {
        return TransactionStatus.Committed;
      }
    }
    return TransactionStatus.Included;
  }

  public get commitTxHash(): string {
    return this.batch ? this.batch.commitTxHash : null;
  }

  public get executeTxHash(): string {
    return this.batch ? this.batch.executeTxHash : null;
  }

  public get proveTxHash(): string {
    return this.batch ? this.batch.proveTxHash : null;
  }

  public get isL1BatchSealed(): boolean {
    return !!this.batch;
  }

  toJSON(): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { number, receiptStatus, batch, ...restFields } = this;
    return {
      ...restFields,
      status: this.status,
      commitTxHash: this.commitTxHash,
      executeTxHash: this.executeTxHash,
      proveTxHash: this.proveTxHash,
      isL1BatchSealed: this.isL1BatchSealed,
    };
  }
}
