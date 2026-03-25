import { Injectable } from "@nestjs/common";
import { VisibleTransaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class VisibleTransactionRepository extends BaseRepository<VisibleTransaction> {
  public constructor(unitOfWork: UnitOfWork) {
    super(VisibleTransaction, unitOfWork);
  }
}
