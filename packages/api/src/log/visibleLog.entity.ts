import { Entity, Column, ManyToOne, JoinColumn, Index, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { Log } from "./log.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";

@Entity({ name: "visibleLogs" })
@Index(["visibleBy", "address", "timestamp", "logIndex"])
@Index(["visibleBy", "transactionHash", "timestamp", "logIndex"])
export class VisibleLog extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly number: number;

  @ManyToOne(() => Log)
  @JoinColumn({ name: "logNumber" })
  public readonly log: Log;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly logNumber: number;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly transactionHash?: string;

  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly address: string;

  @Column({ type: "int" })
  public readonly logIndex: number;

  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly visibleBy: string;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "timestamp" })
  public readonly timestamp: Date;
}
