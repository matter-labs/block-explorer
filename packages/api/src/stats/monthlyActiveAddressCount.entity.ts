import { Entity, Column, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";

@Entity({ name: "monthlyActiveAddressCounts" })
export class MonthlyActiveAddressCount extends BaseEntity {
  @PrimaryColumn({ type: "date" })
  public readonly month: string;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly count: number;
}
