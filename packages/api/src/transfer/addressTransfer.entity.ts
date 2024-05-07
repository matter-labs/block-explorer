import { Entity, Column, Index, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { Transfer, TransferType } from "./transfer.entity";
import { TokenType } from "../token/token.entity";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";

@Entity({ name: "addressTransfers" })
@Index(["address", "isFeeOrRefund", "timestamp", "logIndex"])
@Index(["address", "type", "timestamp", "logIndex"])
@Index(["address", "tokenType", "blockNumber", "logIndex"])
@Index(["address", "tokenAddress", "blockNumber", "logIndex"])
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

  @Column({ type: "enum", enum: TransferType, default: TransferType.Transfer })
  public readonly type: TransferType;

  @Column({ type: "enum", enum: TokenType, default: TokenType.ETH })
  public readonly tokenType: TokenType;

  @Column({ type: "boolean" })
  public readonly isFeeOrRefund: boolean;

  @Column({ type: "int" })
  public readonly logIndex: number;

  @Column({ type: "jsonb", nullable: true })
  public readonly fields?: Record<string, string>;

  @Column({ type: "boolean", default: false })
  public readonly isInternal: boolean;
}
