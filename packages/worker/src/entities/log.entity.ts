import { Entity, Column, JoinColumn, ManyToOne, PrimaryColumn, Index } from "typeorm";
import { Block } from "./block.entity";
import { Transaction } from "./transaction.entity";
import { hash64HexTransformer } from "../transformers/hash64Hex.transformer";
import { hexTransformer } from "../transformers/hex.transformer";
import { hexArrayTransformer } from "../transformers/hexArray.transformer";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { BaseEntity } from "./base.entity";

@Entity({ name: "logs" })
@Index(["address", "timestamp", "logIndex"])
@Index(["transactionHash", "timestamp", "logIndex"])
@Index(["address", "blockNumber", "logIndex"])
export class Log extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly number: number;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockNumber" })
  private readonly _block: never;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transactionHash" })
  private readonly _transaction: never;

  @Column({ type: "bytea", nullable: true, transformer: hash64HexTransformer })
  public readonly transactionHash?: string;

  @Column({ type: "int" })
  public readonly transactionIndex: number;

  @Column({ type: "boolean", nullable: true })
  public readonly removed?: boolean;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly address: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly data: string;

  @Column({ type: "bytea", array: true, transformer: hexArrayTransformer })
  public readonly topics: string[];

  @Column({ type: "int" })
  public readonly logIndex: number;

  @Column({ type: "timestamp" })
  public readonly timestamp: string;
}
