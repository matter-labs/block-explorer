import { Injectable } from "@nestjs/common";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { IndexerState } from "../entities";

@Injectable()
export class IndexerStateRepository extends BaseRepository<IndexerState> {
  public constructor(unitOfWork: UnitOfWork) {
    super(IndexerState, unitOfWork);
  }

  public async getLastReadyBlockNumber(): Promise<number> {
    const state = await this.findOneBy({ id: 1 });
    return state?.lastReadyBlockNumber ?? 0;
  }

  public async setLastReadyBlockNumber(blockNumber: number): Promise<void> {
    await this.upsert({ id: 1, lastReadyBlockNumber: blockNumber }, false, ["id"]);
  }
}
