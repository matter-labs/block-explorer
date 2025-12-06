import { Entity, Column, PrimaryColumn, ViewColumn, ViewEntity, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { hexTransformer } from "../../common/transformers/hex.transformer";
import { bigIntNumberTransformer } from "../../common/transformers/bigIntNumber.transformer";
import { Block } from "../../block/block.entity";
import { Transaction } from "./transaction.entity";

@Entity({ name: "internalTransactions" })
@Index(["transactionHash"])
@Index(["blockNumber"])
@Index(["from"])
@Index(["to"])
@Index(["traceIndex"])
@Index(["blockNumber", "traceIndex"])
export class InternalTransaction extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly id: number;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transactionHash" })
  public readonly transaction?: Transaction;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly transactionHash: string;

  @ManyToOne(() => Block)
  @JoinColumn({ name: "blockNumber" })
  public readonly block?: Block;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly from: string;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly to?: string;

  @Column({ type: "numeric", precision: 78, scale: 0, default: "0" })
  public readonly value: string;

  @Column({ type: "bigint", nullable: true })
  public readonly gas?: number;

  @Column({ type: "bigint", nullable: true })
  public readonly gasUsed?: number;

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
