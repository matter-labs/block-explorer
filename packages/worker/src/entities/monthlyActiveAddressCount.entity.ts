import { Entity, Column, PrimaryColumn } from "typeorm";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { BaseEntity } from "./base.entity";

@Entity({ name: "monthlyActiveAddressCounts" })
export class MonthlyActiveAddressCount extends BaseEntity {
  @PrimaryColumn({ type: "date" })
  public readonly month: string;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly count: number;
}
