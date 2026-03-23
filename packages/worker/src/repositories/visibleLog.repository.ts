import { Injectable } from "@nestjs/common";
import { VisibleLog } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class VisibleLogRepository extends BaseRepository<VisibleLog> {
  public constructor(unitOfWork: UnitOfWork) {
    super(VisibleLog, unitOfWork);
  }
}
