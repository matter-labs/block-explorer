import { Entity, Column } from "typeorm";
import { Block } from "./block.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";

@Entity({ name: "blocks" })
export class BlockDetails extends Block {
  @Column({ type: "bytea", transformer: hexTransformer, nullable: true })
  public readonly parentHash?: string;

  @Column({ type: "varchar", length: 128 })
  public readonly gasLimit: string;

  @Column({ type: "varchar", length: 128 })
  public readonly baseFeePerGas: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly extraData: string;

  @Column({ type: "bytea", transformer: hexTransformer, select: false })
  public readonly miner?: string;

  toJSON(): any {
    return {
      ...super.toJSON(),
      ...this,
    };
  }
}
