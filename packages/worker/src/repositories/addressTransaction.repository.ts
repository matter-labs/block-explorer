import { Injectable } from "@nestjs/common";
import { AddressTransaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class AddressTransactionRepository extends BaseRepository<AddressTransaction> {
  public constructor(unitOfWork: UnitOfWork) {
    super(AddressTransaction, unitOfWork);
  }
}
