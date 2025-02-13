import { hexTransformer } from "../common/transformers/hex.transformer";
import { BaseEntity, Check, Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "nftitems" })
@Check(`"symbol" <> ''`)
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

  @Column({ nullable: true })
  public readonly symbol?: string;

  @Column({ nullable: true })
  public readonly name?: string;

  @Column({ nullable: true })
  public readonly description?: string;

  @Column({ nullable: true })
  public readonly imageUrl?: string;

  @Column({ nullable: true })
  public readonly metadataUrl?: string;
}
