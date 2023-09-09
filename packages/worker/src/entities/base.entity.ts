import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity {
  @CreateDateColumn()
  public readonly createdAt: Date;

  @UpdateDateColumn()
  public readonly updatedAt: Date;
}
