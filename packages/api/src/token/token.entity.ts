import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import config from "../config/index";
const { baseTokenData } = config();
export enum TokenType {
  BaseToken = "BASETOKEN",
  ERC20 = "ERC20",
  ERC721 = "ERC721",
}

export const baseToken = async () => {
  // TODO: Properly do and remove this,
  // this is still here to avoid compilation issues.
  return baseTokenData;
};
@Entity({ name: "tokens" })
@Index(["liquidity", "blockNumber", "logIndex"])
export class Token extends BaseEntity {
  @PrimaryColumn({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly l2Address: string;

  @Column({ generated: true, type: "bigint", select: false })
  public readonly number: number;

  @Index()
  @Column({ type: "bytea", nullable: true, transformer: normalizeAddressTransformer })
  public readonly l1Address?: string;

  @Column()
  public readonly symbol: string;

  @Column()
  public readonly name?: string;

  @Column()
  public readonly decimals: number;

  @Column({ type: "bigint", select: false })
  public readonly blockNumber: number;

  @Column({ type: "int", select: false })
  public readonly logIndex: number;

  @Column({ type: "double precision", nullable: true })
  public readonly usdPrice?: number;

  @Column({ type: "double precision", nullable: true })
  public readonly liquidity?: number;

  @Column({ nullable: true })
  public readonly iconURL?: string;

  @Index()
  @Column({ type: "timestamp", nullable: true, select: false })
  public readonly offChainDataUpdatedAt?: Date;
}
