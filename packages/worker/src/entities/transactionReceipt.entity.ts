import { Entity, Column, JoinColumn, ManyToOne, PrimaryColumn, Index } from "typeorm";
import { hexTransformer } from "../transformers/hex.transformer";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { Block } from "./block.entity";
import { Transaction } from "./transaction.entity";
import { CountableEntity } from "./countable.entity";

@Entity({ name: "transactionReceipts" })
export class TransactionReceipt extends CountableEntity {
  @PrimaryColumn({ type: "bytea", transformer: hexTransformer })
  public readonly transactionHash: string;

  @Index()
  @Column({ generated: true, type: "bigint" })
  public override readonly number: number;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transactionHash" })
  private readonly _transaction: never;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly to: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly from: string;

  @Index()
  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly contractAddress?: string;

  @Column({ type: "int" })
  public readonly transactionIndex: number;

  @Column({ type: "int" })
  public readonly type: number;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly root: string;

  @Column({ type: "varchar", length: 128 })
  public readonly gasUsed: string;

  @Column({ type: "varchar", length: 128 })
  public readonly effectiveGasPrice: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly logsBloom: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly blockHash: string;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockNumber" })
  private readonly _block: never;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public override readonly blockNumber: number;

  @Column({ type: "varchar", length: 128 })
  public readonly cumulativeGasUsed: string;

  @Column({ type: "boolean" })
  public readonly byzantium: boolean;

  @Column({ type: "int" })
  public readonly status: number;
}
