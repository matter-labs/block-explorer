import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn, AfterLoad } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { Token } from "../token/token.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { baseToken, ethToken } from "../config";

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
    // tokenAddress might be empty when not all entity fields are requested from the DB
    if (this.tokenAddress && !this.token) {
      const tokenAddress = this.tokenAddress.toLowerCase();
      if (tokenAddress === baseToken.l2Address.toLowerCase()) {
        this.token = baseToken as Token;
      } else if (tokenAddress === ethToken.l2Address.toLowerCase()) {
        this.token = ethToken as Token;
      }
    }
  }
}
