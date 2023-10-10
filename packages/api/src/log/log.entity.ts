import { Entity, Column, Index, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { hexArrayTransformer } from "../common/transformers/hexArray.transformer";
import { Transaction } from "../transaction/entities/transaction.entity";

@Entity({ name: "logs" })
@Index(["blockNumber", "logIndex"])
export class Log extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint", select: false })
  public number: number;

  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly address: string;

  @Column({ type: "bytea", array: true, transformer: hexArrayTransformer })
  public readonly topics: string[];

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly data: string;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transactionHash" })
  public readonly transaction?: Transaction;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly transactionHash?: string;

  @Column({ type: "int" })
  public readonly transactionIndex: number;

  @Column({ type: "int" })
  public readonly logIndex: number;

  @Column({ type: "timestamp" })
  public readonly timestamp: Date;

  toJSON() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { number, ...restFields } = this;
    return restFields;
  }
}
