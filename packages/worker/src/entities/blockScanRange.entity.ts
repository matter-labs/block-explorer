import { Entity, Column, Index, PrimaryColumn } from "typeorm";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";
import { BaseEntity } from "./base.entity";

@Entity({ name: "blockScanRange" })
export class BlockScanRange {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly id: number;

  @Index()
  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly from: number;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly to: number;
}
