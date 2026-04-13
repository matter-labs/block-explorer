import { Entity, Column, ManyToOne, JoinColumn, Index, PrimaryColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Block } from "./block.entity";
import { Log } from "./log.entity";
import { hexTransformer } from "../transformers/hex.transformer";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";

@Entity({ name: "visibleLogs" })
@Index(["visibleBy", "address", "timestamp", "logIndex", "logNumber"])
@Index(["visibleBy", "transactionHash", "timestamp", "logIndex", "logNumber"])
export class VisibleLog extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly number: number;

  @ManyToOne(() => Log)
  @JoinColumn({ name: "logNumber" })
  private readonly _log: never;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly logNumber: number;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly transactionHash?: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly address: string;

  @Column({ type: "int" })
  public readonly logIndex: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly visibleBy: string;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockNumber" })
  private readonly _block: never;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "timestamp" })
  public readonly timestamp: string;
}
