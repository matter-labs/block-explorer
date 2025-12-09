import { Entity, Column, Index, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { InternalTransaction } from "./internalTransaction.entity";
import { hexTransformer } from "../transformers/hex.transformer";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { hash64HexTransformer } from "../transformers/hash64Hex.transformer";

@Entity({ name: "addressInternalTransactions" })
@Index(["address", "blockNumber", "traceIndex"])
@Index(["address", "timestamp", "blockNumber", "traceIndex"])
@Index(["transactionHash", "traceAddress"])
export class AddressInternalTransaction extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly number: number;

  @ManyToOne(() => InternalTransaction, { onDelete: "CASCADE" })
  @JoinColumn([
    { name: "transactionHash", referencedColumnName: "transactionHash" },
    { name: "traceAddress", referencedColumnName: "traceAddress" },
  ])
  public readonly internalTransaction: InternalTransaction;

  @Index()
  @Column({ type: "bytea", transformer: hash64HexTransformer })
  public readonly transactionHash: string;

  @Column({ type: "varchar" })
  public readonly traceAddress: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly address: string;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "timestamp" })
  public readonly timestamp: string;

  @Column({ type: "int" })
  public readonly traceIndex: number;
}
