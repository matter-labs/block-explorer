import { Entity, Column, Index, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { InternalTransaction } from "./internalTransaction.entity";
import { hexTransformer } from "../../common/transformers/hex.transformer";
import { bigIntNumberTransformer } from "../../common/transformers/bigIntNumber.transformer";
import { normalizeAddressTransformer } from "../../common/transformers/normalizeAddress.transformer";

@Entity({ name: "addressInternalTransactions" })
@Index(["address", "blockNumber", "traceIndex"])
@Index(["address", "timestamp", "traceIndex"])
@Index(["address", "callType", "blockNumber", "traceIndex"])
export class AddressInternalTransaction extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly number: number;

  @ManyToOne(() => InternalTransaction)
  @JoinColumn([
    { name: "transactionHash", referencedColumnName: "transactionHash" },
    { name: "traceAddress", referencedColumnName: "traceAddress" },
  ])
  public readonly internalTransaction: InternalTransaction;

  @Index()
  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly transactionHash: string;

  @Column({ type: "varchar" })
  public readonly traceAddress: string;

  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly address: string;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "timestamp" })
  public readonly timestamp: Date;

  @Column({ type: "varchar", nullable: true })
  public readonly callType?: string;

  @Column({ type: "int" })
  public readonly traceIndex: number;
}
