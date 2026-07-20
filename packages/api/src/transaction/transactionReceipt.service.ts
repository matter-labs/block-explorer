import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TransactionReceipt } from "./entities/transactionReceipt.entity";
import { IndexerStateService } from "../indexerState/indexerState.service";

export interface FilterTransactionReceiptsOptions {
  contractAddress?: string;
}

@Injectable()
export class TransactionReceiptService {
  constructor(
    @InjectRepository(TransactionReceipt)
    private readonly transactionReceiptRepository: Repository<TransactionReceipt>,
    private readonly indexerStateService: IndexerStateService
  ) {}

  public async findOne(
    transactionHash: string,
    selectFields?: (keyof TransactionReceipt)[]
  ): Promise<TransactionReceipt> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const queryBuilder = this.transactionReceiptRepository.createQueryBuilder("transactionReceipt");
    queryBuilder.where({ transactionHash });
    queryBuilder.andWhere("transactionReceipt.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    if (selectFields) {
      queryBuilder.select(selectFields.map((selectField) => `transactionReceipt.${selectField}`));
    }
    return await queryBuilder.getOne();
  }
}
