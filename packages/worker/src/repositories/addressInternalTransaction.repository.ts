import { Injectable } from "@nestjs/common";
import { AddressInternalTransaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class AddressInternalTransactionRepository extends BaseRepository<AddressInternalTransaction> {
  public constructor(unitOfWork: UnitOfWork) {
    super(AddressInternalTransaction, unitOfWork);
  }
}
