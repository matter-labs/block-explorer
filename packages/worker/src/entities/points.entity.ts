import { Entity, Column, Index, PrimaryColumn } from "typeorm";
import { CountableEntity } from "./countable.entity";
import { hexTransformer } from "../transformers/hex.transformer";
import { bigIntNumberTransformer } from "../transformers/bigIntNumber.transformer";

@Entity({ name: "points" })
export class Transfer extends CountableEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public override readonly number: number;

  @Index()
  @Column({ type: "bytea", transformer: hexTransformer })
  public readonly address: string;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly stakePoint: number;

  @Column({ type: "bigint", transformer: bigIntNumberTransformer })
  public readonly refPoint: number;
}
