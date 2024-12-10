import { Entity, Column, ManyToOne, JoinColumn, Index, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { Transaction } from "./transaction.entity";
import { hexTransformer } from "../../common/transformers/hex.transformer";
import { bigIntNumberTransformer } from "../../common/transformers/bigIntNumber.transformer";
import { normalizeAddressTransformer } from "../../common/transformers/normalizeAddress.transformer";

@Entity({ name: "addressTransactions" })
@Index(["address", "receivedAt", "transactionIndex"])
export class AddressTransaction extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly number: number;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transactionHash" })
  public readonly transaction: Transaction;

  @Index()
  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly transactionHash: string;

  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly address: string;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "timestamp" })
  public readonly receivedAt: Date;

  @Column({ type: "int" })
  public readonly transactionIndex: number;
}
