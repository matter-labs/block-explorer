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

  public get commitTxHash(): string {
    return this.batch ? this.batch.commitTxHash : null;
  }

  public get executeTxHash(): string {
    return this.batch ? this.batch.executeTxHash : null;
  }

  public get proveTxHash(): string {
    return this.batch ? this.batch.proveTxHash : null;
  }

  public get committedAt(): Date {
    return this.batch ? this.batch.committedAt : null;
  }

  public get executedAt(): Date {
    return this.batch ? this.batch.executedAt : null;
  }

  public get provenAt(): Date {
    return this.batch ? this.batch.provenAt : null;
  }

  public get commitChainId(): number {
    return this.batch ? this.batch.commitChainId : null;
  }

  public get executeChainId(): number {
    return this.batch ? this.batch.executeChainId : null;
  }

  public get proveChainId(): number {
    return this.batch ? this.batch.proveChainId : null;
  }

  toJSON(): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { batch, ...restFields } = this;
    return {
      ...super.toJSON(),
      ...restFields,
      commitTxHash: this.commitTxHash,
      commitChainId: this.commitChainId,
      executeTxHash: this.executeTxHash,
      executeChainId: this.executeChainId,
      proveTxHash: this.proveTxHash,
      proveChainId: this.proveChainId,
      committedAt: this.committedAt,
      executedAt: this.executedAt,
      provenAt: this.provenAt,
    };
  }
}
