import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";
import { BaseEntity } from "../common/entities/base.entity";

@Entity({ name: "counters" })
@Index(["tableName", "queryString"], { unique: true })
export class Counter extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public readonly id: string;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly count: number;

  @Column({ type: "varchar", length: 64 })
  public readonly tableName: string;

  @Column({ type: "varchar" })
  public readonly queryString: string;
}
