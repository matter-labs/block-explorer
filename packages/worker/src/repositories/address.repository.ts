import { Injectable } from "@nestjs/common";
import { Address } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class AddressRepository extends BaseRepository<Address> {
  public constructor(unitOfWork: UnitOfWork) {
    super(Address, unitOfWork);
  }

  public async upsert(addressDto: Partial<Address>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const queryBuilder = transactionManager.createQueryBuilder().insert();
    queryBuilder.into(this.entityTarget);
    queryBuilder.values(addressDto);
    queryBuilder.onConflict(`("address") DO UPDATE 
        SET 
          "updatedAt" = CURRENT_TIMESTAMP,
          address = EXCLUDED.address,
          bytecode = EXCLUDED.bytecode,
          "createdInBlockNumber" = EXCLUDED."createdInBlockNumber",
          "creatorTxHash" = EXCLUDED."creatorTxHash",
          "creatorAddress" = EXCLUDED."creatorAddress",
          "createdInLogIndex" = EXCLUDED."createdInLogIndex"
        WHERE 
          addresses."createdInBlockNumber" IS NULL OR
          EXCLUDED."createdInBlockNumber" > addresses."createdInBlockNumber" OR 
          (
            EXCLUDED."createdInBlockNumber" = addresses."createdInBlockNumber" AND
            EXCLUDED."createdInLogIndex" > addresses."createdInLogIndex"
          )
      `);
    await queryBuilder.execute();
  }
}
