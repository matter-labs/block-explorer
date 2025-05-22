import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, FindOperator, LessThanOrEqual, MoreThanOrEqual, Repository, SelectQueryBuilder } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { paginate } from "../common/utils";
import { CounterCriteria, IPaginationOptions, SortingOrder } from "../common/types";
import { Transaction } from "./entities/transaction.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { Batch } from "../batch/batch.entity";
import { CounterService } from "../counter/counter.service";
import { Log } from "../log/log.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { zeroPadValue } from "ethers";

export interface FilterTransactionsOptions {
  blockNumber?: number;
  address?: string;
  l1BatchNumber?: number;
  receivedAt?: FindOperator<Date>;
  filterAddressInLogTopics?: boolean;
  visibleBy?: string;
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

      const commonParams: Record<string, string | number | Date> = {
        address: hexTransformer.to(filterOptions.address),
        ...(filterOptions.blockNumber !== undefined && { blockNumber: filterOptions.blockNumber }),
        ...(filterOptions.l1BatchNumber !== undefined && { l1BatchNumber: filterOptions.l1BatchNumber }),
        ...(filterOptions.visibleBy !== undefined && { visibleBy: hexTransformer.to(filterOptions.visibleBy) }),
      };

      // FindOperator doesn't work with this query, so we need to build the filter manually
      let receivedAtFilter: string | undefined = undefined;
      if (filterOptions.receivedAt !== undefined) {
        switch (filterOptions.receivedAt.type) {
          case "between":
            receivedAtFilter = `BETWEEN :receivedAtStart AND :receivedAtEnd`;
            commonParams.receivedAtStart = filterOptions.receivedAt.value[0];
            commonParams.receivedAtEnd = filterOptions.receivedAt.value[1];
            break;
          case "moreThanOrEqual":
            receivedAtFilter = `>= :receivedAt`;
            commonParams.receivedAt = filterOptions.receivedAt.value;
            break;
          case "lessThanOrEqual":
            receivedAtFilter = `<= :receivedAt`;
            commonParams.receivedAt = filterOptions.receivedAt.value;
            break;
          default:
            throw new Error(`Unsupported FindOperator type: ${filterOptions.receivedAt.type}`);
        }
      }

      const addressTransactionSubQuery =
        this.addressTransactionRepository.createQueryBuilder("sub1_addressTransaction");
      addressTransactionSubQuery.select("sub1_addressTransaction.transactionHash");
      addressTransactionSubQuery.innerJoin("sub1_addressTransaction.transaction", "sub1_transaction");
      addressTransactionSubQuery.where("sub1_addressTransaction.address = :address");

      if (filterOptions.blockNumber !== undefined) {
        addressTransactionSubQuery.andWhere("sub1_transaction.blockNumber = :blockNumber");
      }
      if (filterOptions.l1BatchNumber !== undefined) {
        addressTransactionSubQuery.andWhere("sub1_transaction.l1BatchNumber = :l1BatchNumber");
      }
      if (filterOptions.receivedAt !== undefined) {
        addressTransactionSubQuery.andWhere(`sub1_transaction.receivedAt ${receivedAtFilter}`);
      }
      // If `visibleBy` is provided, we filter by transactions that are
      // from or to `visibleBy` address in addition to being from or to `address
      if (filterOptions.visibleBy !== undefined) {
        addressTransactionSubQuery.andWhere(
          new Brackets((qb) => {
            qb.where("sub1_transaction.from = :visibleBy");
            qb.orWhere("sub1_transaction.to = :visibleBy");
          })
        );
      }

      // If `filterAddressInLogTopics` is provided, we filter by log topics where
      // the address is mentioned
      if (filterOptions.filterAddressInLogTopics) {
        const logSubQuery = this.logRepository.createQueryBuilder("sub2_log");
        logSubQuery.select("sub2_log.transactionHash");
        logSubQuery.innerJoin("sub2_log.transaction", "sub2_transaction");

        logSubQuery.where(
          new Brackets((qb) => {
            qb.where("sub2_log.topics[1] = :paddedAddressBytes");
            qb.orWhere("sub2_log.topics[2] = :paddedAddressBytes");
            qb.orWhere("sub2_log.topics[3] = :paddedAddressBytes");
          })
        );
        // If `visibleBy` is provided, in addition to filtering by log topics,
        // we filter by transactions that were from or to `address`
        if (filterOptions.visibleBy !== undefined) {
          logSubQuery.andWhere(
            new Brackets((qb) => {
              qb.where("sub2_transaction.from = :address");
              qb.orWhere("sub2_transaction.to = :address");
            })
          );
        }

        if (filterOptions.blockNumber !== undefined) {
          logSubQuery.andWhere("sub2_transaction.blockNumber = :blockNumber");
        }
        if (filterOptions.l1BatchNumber !== undefined) {
          logSubQuery.andWhere("sub2_transaction.l1BatchNumber = :l1BatchNumber");
        }
        if (filterOptions.receivedAt !== undefined) {
          logSubQuery.andWhere(`sub2_transaction.receivedAt ${receivedAtFilter}`);
        }

        // If `visibleBy` is provided, we use it to filter log topics given we want to see transactions
        // from `visibleBy` perspective
        const logAddressParam = {
          paddedAddressBytes: hexTransformer.to(zeroPadValue(filterOptions.visibleBy || filterOptions.address, 32)),
        };

        queryBuilder.where(`transaction.hash IN (
          (${addressTransactionSubQuery.getQuery()})
          UNION
          (${logSubQuery.getQuery()})
        )`);
        queryBuilder.setParameters({
          ...commonParams,
          ...logAddressParam,
        });
      } else {
        queryBuilder.where(`transaction.hash IN (${addressTransactionSubQuery.getQuery()})`);
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
