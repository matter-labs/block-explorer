import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TransactionReceipt } from "./entities/transactionReceipt.entity";

export interface FilterTransactionReceiptsOptions {
  contractAddress?: string;
}

@Injectable()
export class TransactionReceiptService {
  constructor(
    @InjectRepository(TransactionReceipt)
    private readonly transactionReceiptRepository: Repository<TransactionReceipt>
  ) {}

  public async findOne(
    transactionHash: string,
    selectFields?: (keyof TransactionReceipt)[]
  ): Promise<TransactionReceipt> {
    const queryBuilder = this.transactionReceiptRepository.createQueryBuilder("transactionReceipt");
    queryBuilder.where({ transactionHash });
    if (selectFields) {
      queryBuilder.select(selectFields.map((selectField) => `transactionReceipt.${selectField}`));
    }
    return await queryBuilder.getOne();
  }
}
