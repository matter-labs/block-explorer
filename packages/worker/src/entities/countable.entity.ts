import { BaseEntity } from "./base.entity";

export abstract class CountableEntity extends BaseEntity {
  public readonly number: number;
  public readonly blockNumber: number;
}
