import { Injectable } from "@nestjs/common";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { CounterState } from "../entities";

@Injectable()
export class CounterStateRepository extends BaseRepository<CounterState> {
  public constructor(unitOfWork: UnitOfWork) {
    super(CounterState, unitOfWork);
  }
}
