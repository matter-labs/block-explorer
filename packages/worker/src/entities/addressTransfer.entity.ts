import { Entity, Column, ManyToOne, JoinColumn, Index, PrimaryColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Block } from "./block.entity";
import { Transfer, TransferType } from "./transfer.entity";
import { TokenType } from "./token.entity";
import { hexTransformer } from "../transformers/hex.transformer";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { TransferFields } from "../dataFetcher/types";

@Entity({ name: "addressTransfers" })
@Index(["address", "isFeeOrRefund", "timestamp", "logIndex"])
@Index(["address", "type", "timestamp", "logIndex"])
@Index(["address", "tokenAddress", "blockNumber", "logIndex"])
@Index(["address", "tokenType", "blockNumber", "logIndex"])
@Index(["address", "isInternal", "blockNumber", "logIndex"])
export class AddressTransfer extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly number: number;

  @ManyToOne(() => Transfer)
  @JoinColumn({ name: "transferNumber" })
  private readonly _transfer: never;

  @Index()
  @Column({ type: "bigint" })
  public readonly transferNumber: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly address: string;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly tokenAddress?: string;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockNumber" })
  private readonly _block: never;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "timestamp" })
  public readonly timestamp: string;

  @Column({ type: "enum", enum: TransferType, default: TransferType.Transfer })
  public readonly type: TransferType;

  @Column({ type: "enum", enum: TokenType, default: TokenType.ETH })
  public readonly tokenType: TokenType;

  @Column({ type: "boolean" })
  public readonly isFeeOrRefund: boolean;

  @Column({ type: "jsonb", nullable: true })
  public readonly fields?: TransferFields;

  @Column({ type: "int" })
  public readonly logIndex: number;

  @Column({ type: "boolean", default: false })
  public readonly isInternal: boolean;
}
