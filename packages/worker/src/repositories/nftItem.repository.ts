import { Injectable } from "@nestjs/common";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { NftItem } from "../entities/nft.entity";

@Injectable()
export class NftItemRepository extends BaseRepository<NftItem> {
  public constructor(unitOfWork: UnitOfWork) {
    super(NftItem, unitOfWork);
  }
}
