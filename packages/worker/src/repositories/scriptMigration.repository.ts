import { Injectable } from "@nestjs/common";
import { ScriptMigration } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class ScriptMigrationRepository extends BaseRepository<ScriptMigration> {
  public constructor(unitOfWork: UnitOfWork) {
    super(ScriptMigration, unitOfWork);
  }

  public async update(criteria: any, partialEntity: Partial<ScriptMigration>) {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.update(ScriptMigration, criteria, partialEntity);
  }
}
