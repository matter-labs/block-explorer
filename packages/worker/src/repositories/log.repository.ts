import { Injectable } from "@nestjs/common";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { Log } from "../entities";

@Injectable()
export class LogRepository extends BaseRepository<Log> {
  public constructor(unitOfWork: UnitOfWork) {
    super(Log, unitOfWork);
  }
}
