import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

export interface ScriptMigrationParams {
  [key: string]: string;
}

export enum ScriptMigrationStatus {
  NotStarted = "not_started",
  Pending = "pending",
  Failed = "failed",
  Completed = "completed",
  Outdated = "outdated",
}

@Entity({ name: "scriptMigrations" })
export class ScriptMigration extends BaseEntity {
  @PrimaryColumn({ generated: true, type: "bigint" })
  public readonly number: number;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  public readonly name: string;

  @Index()
  @Column({ type: "bigint" })
  public readonly timestamp: number;

  @Index()
  @Column({ type: "enum", enum: ScriptMigrationStatus, default: ScriptMigrationStatus.NotStarted })
  public readonly status: ScriptMigrationStatus;

  @Column({ type: "jsonb", nullable: true })
  public readonly params?: ScriptMigrationParams;
}
