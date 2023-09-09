import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { BigNumber } from "ethers";
import { BaseEntity } from "./base.entity";
import { Block } from "./block.entity";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { bigNumberTransformer } from "../transformers/bigNumber.transformer";
import { hexTransformer } from "../transformers/hex.transformer";

@Entity({ name: "balances" })
@Index(["blockNumber", "balance"])
export class Balance extends BaseEntity {
  @PrimaryColumn({ type: "bytea", transformer: hexTransformer })
  public readonly address: string;

  @PrimaryColumn({ type: "bytea", transformer: hexTransformer })
  public readonly tokenAddress: string;

  @ManyToOne(() => Block, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockNumber" })
  private readonly _block: never;

  @PrimaryColumn({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "varchar", length: 128, transformer: bigNumberTransformer })
  public readonly balance: BigNumber;
}
