import { Entity, Column, Index, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { Transfer } from "./transfer.entity";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";

@Entity({ name: "addressTransfers" })
@Index(["address", "isFeeOrRefund", "timestamp", "logIndex"])
@Index(["address", "tokenAddress", "fields", "blockNumber", "logIndex"])
export class AddressTransfer extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly number: number;

  @ManyToOne(() => Transfer)
  @JoinColumn({ name: "transferNumber" })
  public readonly transfer: Transfer;

  @Index()
  @Column({ type: "bigint" })
  public readonly transferNumber: number;

  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly address: string;

  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly tokenAddress: string;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "timestamp" })
  public readonly timestamp: Date;

  @Column({ type: "boolean" })
  public readonly isFeeOrRefund: boolean;

  @Column({ type: "int" })
  public readonly logIndex: number;

  @Column({ type: "jsonb", nullable: true })
  public readonly fields?: Record<string, string>;

  @Column({ type: "boolean" })
  public readonly isInternal: boolean;
}
