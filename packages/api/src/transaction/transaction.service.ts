import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOperator, SelectQueryBuilder, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { paginate } from "../common/utils";
import { IPaginationOptions, CounterCriteria, SortingOrder } from "../common/types";
import { Transaction } from "./entities/transaction.entity";
import { TransactionDetails } from "./entities/transactionDetails.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { Batch } from "../batch/batch.entity";
import { CounterService } from "../counter/counter.service";

export interface FilterTransactionsOptions {
  blockNumber?: number;
  address?: string;
  l1BatchNumber?: number;
  receivedAt?: FindOperator<Date>;
}

export interface FindByAddressFilterTransactionsOptions {
  startBlock?: number;
  endBlock?: number;
  page?: number;
  offset?: number;
  sort?: SortingOrder;
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionDetails)
    private readonly transactionDetailsRepository: Repository<TransactionDetails>,
    @InjectRepository(AddressTransaction)
    private readonly addressTransactionRepository: Repository<AddressTransaction>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    private readonly counterService: CounterService
  ) {}

  public async findOne(hash: string): Promise<TransactionDetails> {
    const queryBuilder = this.transactionDetailsRepository.createQueryBuilder("transaction");
    queryBuilder.leftJoinAndSelect("transaction.batch", "batch");
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transactionReceipt.gasUsed"]);
    queryBuilder.where({ hash });
    return await queryBuilder.getOne();
  }

  public async exists(hash: string): Promise<boolean> {
    return (await this.transactionRepository.findOne({ where: { hash }, select: { hash: true } })) != null;
  }

  public async findAll(
    filterOptions: FilterTransactionsOptions,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Transaction>> {
    if (filterOptions.address) {
      const queryBuilder = this.addressTransactionRepository.createQueryBuilder("addressTransaction");
      queryBuilder.select("addressTransaction.number");
      queryBuilder.leftJoinAndSelect("addressTransaction.transaction", "transaction");
      queryBuilder.leftJoin("transaction.batch", "batch");
      queryBuilder.addSelect(["batch.commitTxHash", "batch.executeTxHash", "batch.proveTxHash"]);
      queryBuilder.where({
        address: filterOptions.address,
        ...(filterOptions.receivedAt && { receivedAt: filterOptions.receivedAt }),
        // can't add filters on transaction here due to typeOrm issue with filters on joined tables
      });
      if (filterOptions.blockNumber !== undefined) {
        // can't use filters on transaction as object here due to typeOrm issue with filters on joined tables
        queryBuilder.andWhere("transaction.blockNumber = :blockNumber", { blockNumber: filterOptions.blockNumber });
      }
      if (filterOptions.l1BatchNumber !== undefined) {
        // can't use filters on transaction as object here due to typeOrm issue with filters on joined tables
        queryBuilder.andWhere("transaction.l1BatchNumber = :l1BatchNumber", {
          l1BatchNumber: filterOptions.l1BatchNumber,
        });
      }
      queryBuilder.orderBy("addressTransaction.blockNumber", "DESC");
      queryBuilder.addOrderBy("addressTransaction.receivedAt", "DESC");
      queryBuilder.addOrderBy("addressTransaction.transactionIndex", "DESC");
      const addressTransactions = await paginate<AddressTransaction>(queryBuilder, paginationOptions);
      return {
        ...addressTransactions,
        items: addressTransactions.items.map((item) => item.transaction),
      };
    } else {
      const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");
      queryBuilder.leftJoin("transaction.batch", "batch");
      queryBuilder.addSelect(["batch.commitTxHash", "batch.executeTxHash", "batch.proveTxHash"]);
      queryBuilder.where(filterOptions);
      queryBuilder.orderBy("transaction.blockNumber", "DESC");
      queryBuilder.addOrderBy("transaction.receivedAt", "DESC");
      queryBuilder.addOrderBy("transaction.transactionIndex", "DESC");
      return await paginate<Transaction>(queryBuilder, paginationOptions);
    }
  }

  public async findByAddress(
    address: string,
    {
      startBlock,
      endBlock,
      page = 1,
      offset = 10,
      sort = SortingOrder.Desc,
    }: FindByAddressFilterTransactionsOptions = {}
  ): Promise<AddressTransaction[]> {
    const queryBuilder = this.addressTransactionRepository.createQueryBuilder("addressTransaction");
    queryBuilder.select("addressTransaction.number");
    queryBuilder.leftJoinAndSelect("addressTransaction.transaction", "transaction");
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect([
      "transactionReceipt.gasUsed",
      "transactionReceipt.cumulativeGasUsed",
      "transactionReceipt.contractAddress",
    ]);
    queryBuilder.leftJoin("transaction.batch", "batch");
    queryBuilder.addSelect(["batch.commitTxHash", "batch.executeTxHash", "batch.proveTxHash"]);
    queryBuilder.where({ address });
    if (startBlock !== undefined) {
      queryBuilder.andWhere({
        blockNumber: MoreThanOrEqual(startBlock),
      });
    }
    if (endBlock !== undefined) {
      queryBuilder.andWhere({
        blockNumber: LessThanOrEqual(endBlock),
      });
    }
    const order = sort === SortingOrder.Asc ? "ASC" : "DESC";
    queryBuilder.orderBy("addressTransaction.blockNumber", order);
    queryBuilder.addOrderBy("addressTransaction.receivedAt", order);
    queryBuilder.addOrderBy("addressTransaction.transactionIndex", order);
    queryBuilder.offset((page - 1) * offset);
    queryBuilder.limit(offset);
    const addressTransactions = await queryBuilder.getMany();
    return addressTransactions;
  }

  private getAccountNonceQueryBuilder(accountAddress: string, isVerified: boolean): SelectQueryBuilder<Transaction> {
    const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");
    queryBuilder.select("nonce");
    queryBuilder.where({ from: accountAddress, isL1Originated: false });
    if (isVerified) {
      const lastVerifiedBatchQuery = this.batchRepository.createQueryBuilder("batch");
      lastVerifiedBatchQuery.select("number");
      lastVerifiedBatchQuery.where("batch.executedAt IS NOT NULL");
      lastVerifiedBatchQuery.orderBy("batch.executedAt", "DESC");
      lastVerifiedBatchQuery.addOrderBy("batch.number", "DESC");
      lastVerifiedBatchQuery.limit(1);

      queryBuilder.andWhere(`transaction.l1BatchNumber <= (${lastVerifiedBatchQuery.getQuery()})`);
    }
    queryBuilder.orderBy("transaction.l1BatchNumber", "DESC");
    queryBuilder.addOrderBy("transaction.nonce", "DESC");
    queryBuilder.limit(1);
    return queryBuilder;
  }

  public async getAccountNonce({
    accountAddress,
    isVerified = false,
  }: {
    accountAddress: string;
    isVerified?: boolean;
  }): Promise<number> {
    const queryBuilder = this.getAccountNonceQueryBuilder(accountAddress, isVerified);
    const transaction = await queryBuilder.getRawOne();
    return transaction?.nonce != null ? Number(transaction.nonce) + 1 : 0;
  }

  public count(criteria: CounterCriteria<Transaction> = {}): Promise<number> {
    return this.counterService.count(Transaction, criteria);
  }
}
