import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOperator, SelectQueryBuilder, MoreThanOrEqual, LessThanOrEqual, Brackets } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { paginate } from "../common/utils";
import { IPaginationOptions, CounterCriteria, SortingOrder } from "../common/types";
import { Transaction } from "./entities/transaction.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { Batch } from "../batch/batch.entity";
import { CounterService } from "../counter/counter.service";
import { Log } from "../log/log.entity";
import { hexTransformer } from "src/common/transformers/hex.transformer";

export interface FilterTransactionsOptions {
  blockNumber?: number;
  address?: string;
  l1BatchNumber?: number;
  receivedAt?: FindOperator<Date>;
  filterAddressInLogTopics?: boolean;
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
    @InjectRepository(AddressTransaction)
    private readonly addressTransactionRepository: Repository<AddressTransaction>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    private readonly counterService: CounterService,
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>
  ) {}

  public async findOne(hash: string): Promise<Transaction> {
    const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");
    queryBuilder.leftJoinAndSelect("transaction.batch", "batch");
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
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
      const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");

      const commonParams = {
        address: filterOptions.address,
        ...(filterOptions.blockNumber !== undefined && { blockNumber: filterOptions.blockNumber }),
        ...(filterOptions.l1BatchNumber !== undefined && { l1BatchNumber: filterOptions.l1BatchNumber }),
        ...(filterOptions.receivedAt && { receivedAt: filterOptions.receivedAt }),
      };

      const subQuery1 = this.addressTransactionRepository
        .createQueryBuilder("sub1_addressTransaction")
        .select("sub1_addressTransaction.transactionHash")
        .innerJoin("sub1_addressTransaction.transaction", "sub1_transaction")
        .where("sub1_addressTransaction.address = :address");

      if (filterOptions.blockNumber !== undefined) {
        subQuery1.andWhere("sub1_transaction.blockNumber = :blockNumber");
      }
      if (filterOptions.l1BatchNumber !== undefined) {
        subQuery1.andWhere("sub1_transaction.l1BatchNumber = :l1BatchNumber");
      }
      if (filterOptions.receivedAt) {
        subQuery1.andWhere("sub1_transaction.receivedAt = :receivedAt");
      }

      if (filterOptions.filterAddressInLogTopics) {
        const subQuery2 = this.logRepository
          .createQueryBuilder("sub2_log")
          .select("sub2_log.transactionHash")
          .innerJoin(Transaction, "sub2_transaction", "sub2_transaction.hash = sub2_log.transactionHash");

        subQuery2.where(
          new Brackets((qb) => {
            qb.where("sub2_log.topics[1] = :paddedAddressBytes")
              .orWhere("sub2_log.topics[2] = :paddedAddressBytes")
              .orWhere("sub2_log.topics[3] = :paddedAddressBytes");
          })
        );

        if (filterOptions.blockNumber !== undefined) {
          subQuery2.andWhere("sub_tx2.blockNumber = :blockNumber");
        }
        if (filterOptions.l1BatchNumber !== undefined) {
          subQuery2.andWhere("sub_tx2.l1BatchNumber = :l1BatchNumber");
        }
        if (filterOptions.receivedAt) {
          subQuery2.andWhere("sub_tx2.receivedAt = :receivedAt");
        }

        const addressBytes = filterOptions.address.substring(2);
        const paddedAddress = `0x${"0".repeat(24)}${addressBytes}`;
        const logAddressParam = { paddedAddressBytes: hexTransformer.to(paddedAddress) };

        queryBuilder.where(`transaction.hash IN (
          (${subQuery1.getQuery()})
          UNION
          (${subQuery2.getQuery()})
        )`);
        queryBuilder.setParameters({
          ...commonParams,
          ...logAddressParam,
        });
      } else {
        queryBuilder.where(`transaction.hash IN (${subQuery1.getQuery()})`);
        queryBuilder.setParameters(commonParams);
      }

      queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
      queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
      queryBuilder.leftJoin("transaction.batch", "batch");
      queryBuilder.addSelect(["batch.commitTxHash", "batch.executeTxHash", "batch.proveTxHash"]);

      queryBuilder.orderBy("transaction.blockNumber", "DESC");
      queryBuilder.addOrderBy("transaction.receivedAt", "DESC");
      queryBuilder.addOrderBy("transaction.transactionIndex", "DESC");

      return await paginate<Transaction>(queryBuilder, paginationOptions);
    } else {
      const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");
      queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
      queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
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
