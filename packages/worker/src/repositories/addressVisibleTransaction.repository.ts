import { Injectable } from "@nestjs/common";
import { AddressVisibleTransaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class AddressVisibleTransactionRepository extends BaseRepository<AddressVisibleTransaction> {
  public constructor(unitOfWork: UnitOfWork) {
    super(AddressVisibleTransaction, unitOfWork);
  }
}
