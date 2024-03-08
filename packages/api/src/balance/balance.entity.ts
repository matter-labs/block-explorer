import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn, AfterLoad } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { Token, baseToken } from "../token/token.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { BASE_TOKEN_ADDRESS } from "../common/constants";

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
  async populateEthToken() {
    if (!this.token && this.tokenAddress.toLowerCase() === BASE_TOKEN_ADDRESS.toLowerCase()) {
      const nativeTokenData = (await baseToken()) as Token;
      this.token = nativeTokenData;
    }
  }
}
