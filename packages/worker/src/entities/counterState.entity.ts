import { Entity, Column, PrimaryColumn } from "typeorm";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { BaseEntity } from "./base.entity";

@Entity({ name: "counterStates" })
export class CounterState extends BaseEntity {
  @PrimaryColumn({ type: "varchar", length: 64 })
  public readonly tableName: string;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly lastProcessedRecordNumber: number;
}
