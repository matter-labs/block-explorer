import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { stringTransformer } from "../transformers/string.transformer";
import { hexTransformer } from "../transformers/hex.transformer";
import { BaseEntity } from "./base.entity";

@Entity({ name: "nftitems" })
@Index(["tokenId", "tokenAddress"])
export class NftItem extends BaseEntity {
  @PrimaryColumn()
  public readonly tokenId: string;

  @PrimaryColumn({ type: "bytea", transformer: hexTransformer })
  public readonly tokenAddress: string;

  @Column({ generated: true, type: "bigint" })
  public readonly number: number;

  @Index()
  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly owner: string;

  @Column({ transformer: stringTransformer, nullable: true })
  public readonly name?: string;

  @Column({ transformer: stringTransformer, nullable: true })
  public readonly description?: string;

  @Column({ transformer: stringTransformer, nullable: true })
  public readonly imageUrl?: string;

  @Column({ transformer: stringTransformer, nullable: true })
  public readonly metadataUrl?: string;
}
