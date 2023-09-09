import { Injectable } from "@nestjs/common";
import { TransactionReceipt } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class TransactionReceiptRepository extends BaseRepository<TransactionReceipt> {
  public constructor(unitOfWork: UnitOfWork) {
    super(TransactionReceipt, unitOfWork);
  }
}
