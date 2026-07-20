import { Entity, Column, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { bigIntNumberTransformer } from "../common/transformers/bigIntNumber.transformer";

@Entity({ name: "indexerState" })
export class IndexerState extends BaseEntity {
  @PrimaryColumn({ type: "int" })
  public readonly id: number;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly lastReadyBlockNumber: number;
}
