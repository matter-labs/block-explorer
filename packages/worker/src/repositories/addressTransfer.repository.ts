import { Injectable } from "@nestjs/common";
import { AddressTransfer } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class AddressTransferRepository extends BaseRepository<AddressTransfer> {
  public constructor(unitOfWork: UnitOfWork) {
    super(AddressTransfer, unitOfWork);
  }
}
