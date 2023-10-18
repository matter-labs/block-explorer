import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";

export enum TokenType {
  ETH = "ETH",
  ERC20 = "ERC20",
  ERC721 = "ERC721",
}

export const ETH_TOKEN: Token = {
  l2Address: "0x000000000000000000000000000000000000800A",
  l1Address: null,
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
} as Token;

@Entity({ name: "tokens" })
@Index(["blockNumber", "logIndex"])
export class Token extends BaseEntity {
  @PrimaryColumn({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly l2Address: string;

  @Column({ generated: true, type: "bigint", select: false })
  public readonly number: number;

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
}
