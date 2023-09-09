import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Block } from "./block.entity";
import { Transaction } from "./transaction.entity";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { hash64HexTransformer } from "../transformers/hash64Hex.transformer";
import { hexTransformer } from "../transformers/hex.transformer";

@Entity({ name: "addresses" })
export class Address extends BaseEntity {
  @PrimaryColumn({ type: "bytea", transformer: hexTransformer })
  public readonly address: string;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "createdInBlockNumber" })
  private readonly _block: never;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly bytecode: string;

  @Index()
  @Column({ type: "bigint", nullable: true, transformer: bigIntNumberTransformer })
  public readonly createdInBlockNumber?: number;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "creatorTxHash" })
  private readonly _transaction?: never;

  @Index()
  @Column({ type: "bytea", nullable: true, transformer: hash64HexTransformer })
  public readonly creatorTxHash?: string;

  @Column({ type: "int", nullable: true })
  public readonly createdInLogIndex?: number;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly creatorAddress?: string;
}
