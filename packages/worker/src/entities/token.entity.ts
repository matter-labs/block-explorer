import { Entity, Column, PrimaryColumn, Check, Index, JoinColumn, ManyToOne } from "typeorm";
import { Block } from "./block.entity";
import { Transaction } from "./transaction.entity";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { stringTransformer } from "../transformers/string.transformer";
import { hexTransformer } from "../transformers/hex.transformer";
import { BaseEntity } from "./base.entity";

export enum TokenType {
  ETH = "ETH",
  ERC20 = "ERC20",
  ERC721 = "ERC721",
}

@Entity({ name: "tokens" })
@Check(`"symbol" <> ''`)
@Index(["liquidity", "blockNumber", "logIndex"])
export class Token extends BaseEntity {
  @PrimaryColumn({ type: "bytea", transformer: hexTransformer })
  public readonly l2Address: string;

  @Index()
  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly l1Address?: string;

  @Column({ generated: true, type: "bigint" })
  public readonly number: number;

  @Column({ transformer: stringTransformer })
  public readonly symbol: string;

  @Column({ transformer: stringTransformer })
  public readonly name?: string;

  @Column()
  public readonly decimals: number;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockNumber" })
  private readonly _block: never;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transactionHash" })
  private readonly _transaction: never;

  @Index()
  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly transactionHash: string;

  @Column({ type: "int" })
  public readonly logIndex: number;

  @Column({ type: "double precision", nullable: true })
  public readonly usdPrice?: number;

  @Column({ type: "double precision", nullable: true })
  public readonly liquidity?: number;

  @Column({ nullable: true })
  public readonly iconURL?: string;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  public readonly offChainDataUpdatedAt?: Date;
}
