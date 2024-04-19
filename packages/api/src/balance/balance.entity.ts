import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn, AfterLoad } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { Token } from "../token/token.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { baseTokenData } from "../config/index";
@Entity({ name: "balances" })
export class Balance extends BaseEntity {
  @PrimaryColumn({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly address: string;

  @ManyToOne(() => Token, { createForeignKeyConstraints: false })
  @JoinColumn({ name: "tokenAddress" })
  public token?: Token;

  @PrimaryColumn({ type: "bytea", transformer: normalizeAddressTransformer })
  public readonly tokenAddress: string;

  @Index()
  @PrimaryColumn({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly blockNumber: number;

  @Column({ type: "varchar", length: 128 })
  public readonly balance: string;

  @AfterLoad()
  populateBaseToken() {
    if (!this.token && this.tokenAddress.toLowerCase() === baseTokenData.l2Address.toLowerCase()) {
      this.token = baseTokenData as Token;
    }
  }
}
