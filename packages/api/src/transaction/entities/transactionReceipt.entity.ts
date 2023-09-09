import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { normalizeAddressTransformer } from "../../common/transformers/normalizeAddress.transformer";
import { hexTransformer } from "../../common/transformers/hex.transformer";

@Entity({ name: "transactionReceipts" })
export class TransactionReceipt extends BaseEntity {
  @PrimaryColumn({ type: "bytea", transformer: hexTransformer })
  public readonly transactionHash: string;

  @Column({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly from: string;

  @Index()
  @Column({ type: "bytea", nullable: true, transformer: normalizeAddressTransformer })
  public readonly contractAddress?: string;

  @Column({ type: "int" })
  public readonly status: number;

  @Column({ type: "varchar", length: 128 })
  public readonly gasUsed: string;

  @Column({ type: "varchar", length: 128 })
  public readonly cumulativeGasUsed: string;
}
