import { Entity, Column, PrimaryColumn } from "typeorm";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { BaseEntity } from "./base.entity";

@Entity({ name: "indexerState" })
export class IndexerState extends BaseEntity {
  @PrimaryColumn({ type: "int" })
  public readonly id: number;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly lastReadyBlockNumber: number;
}
