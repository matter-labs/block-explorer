import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { hexTransformer } from "../common/transformers/hex.transformer";

@Entity({ name: "addresses" })
export class Address extends BaseEntity {
  @PrimaryColumn({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly address: string;

  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly bytecode: string;

  @Index()
  @Column({ type: "bigint", nullable: true, transformer: bigIntNumberTransformer })
  public readonly createdInBlockNumber?: number;

  @Column({ type: "bytea", nullable: true, transformer: hexTransformer })
  public readonly creatorTxHash?: string;

  @Column({ type: "bytea", nullable: true, transformer: normalizeAddressTransformer })
  public readonly creatorAddress?: string;
}
