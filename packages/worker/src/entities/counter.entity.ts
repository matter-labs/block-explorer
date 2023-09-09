import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity({ name: "counters" })
@Index(["tableName", "queryString"], { unique: true })
export class Counter extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public readonly id: string;

  @Column({ type: "bigint" })
  public readonly count: number;

  @Column({ type: "varchar", length: 64 })
  public readonly tableName: string;

  @Column({ type: "varchar" })
  public readonly queryString: string;
}
