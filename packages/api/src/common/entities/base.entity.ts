import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity {
  @CreateDateColumn({ select: false })
  public readonly createdAt: Date;

  @UpdateDateColumn({ select: false })
  public readonly updatedAt: Date;
}
