import { BaseEntity } from "./base.entity";

export abstract class NumerableEntity extends BaseEntity {
  public readonly number: number;
}
