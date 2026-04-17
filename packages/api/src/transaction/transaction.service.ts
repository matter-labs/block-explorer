import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOperator, LessThanOrEqual, MoreThanOrEqual, Repository, SelectQueryBuilder } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { isAddressEqual, paginate, computeFromToMinMax, copyOrderBy } from "../common/utils";
import { CounterCriteria, IPaginationOptions, SortingOrder } from "../common/types";
import { Transaction } from "./entities/transaction.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { VisibleTransaction } from "./entities/visibleTransaction.entity";
import { AddressVisibleTransaction } from "./entities/addressVisibleTransaction.entity";
import { Block, BlockStatus } from "../block/block.entity";
import { CounterService } from "../counter/counter.service";
import { IndexerStateService } from "../indexerState/indexerState.service";
import { UserParam } from "../user/user.decorator";

export interface FilterTransactionsOptions {
  blockNumber?: number | FindOperator<number>;
  address?: string;
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
    @InjectRepository(VisibleTransaction)
    private readonly visibleTransactionRepository: Repository<VisibleTransaction>,
    @InjectRepository(AddressVisibleTransaction)
    private readonly addressVisibleTransactionRepository: Repository<AddressVisibleTransaction>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly counterService: CounterService,
    private readonly indexerStateService: IndexerStateService,
    private readonly configService: ConfigService
  ) {}

  public async findOne(hash: string): Promise<Transaction> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");
    queryBuilder.leftJoinAndSelect("transaction.block", "block");
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
    queryBuilder.where({ hash });
    const transaction = await queryBuilder.getOne();
    if (transaction?.blockNumber > lastReadyBlockNumber) {
      return null;
    }
    return transaction;
  }

  public async exists(hash: string): Promise<boolean> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const transaction = await this.transactionRepository.findOne({
      where: { hash },
      select: { hash: true, blockNumber: true },
    });
    return transaction != null && transaction.blockNumber <= lastReadyBlockNumber;
  }

  public async findAll(
    filterOptions: FilterTransactionsOptions,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Transaction>> {
    const disableTxVisibilityByTopics = this.configService.get<boolean>("prividium.disableTxVisibilityByTopics");
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const commonFilters = {
      ...(filterOptions.blockNumber !== undefined && { blockNumber: filterOptions.blockNumber }),
    };

    // Case 1: viewing transactions for an arbitrary address as an authorized viewer (prividium)
    if (
      filterOptions.visibleBy &&
      filterOptions.address &&
      !isAddressEqual(filterOptions.address, filterOptions.visibleBy)
    ) {
      if (disableTxVisibilityByTopics) {
        // query transactions strictly between address and visibleBy
        const { fromToMin, fromToMax } = computeFromToMinMax(filterOptions.address, filterOptions.visibleBy);
        const innerQb = this.transactionRepository.createQueryBuilder("transaction");
        innerQb.select("transaction.hash", "hash");
        innerQb.where({ fromToMin, fromToMax, ...commonFilters });
        innerQb.andWhere("transaction.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
        this.addDefaultOrder(innerQb);
        return this.paginateTransactions(innerQb, "hash", paginationOptions);
      }

      // query transactions visible to the user for the address (including topics with user's address)
      const innerQb = this.addressVisibleTransactionRepository.createQueryBuilder("avt");
      innerQb.select("avt.transactionHash", "transactionHash");
      innerQb.where({ address: filterOptions.address, visibleBy: filterOptions.visibleBy, ...commonFilters });
      innerQb.andWhere("avt.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
      this.addDefaultOrder(innerQb);
      return this.paginateTransactions(innerQb, "transactionHash", paginationOptions);
    }

    // Case 2: all transactions visible to a user - own transactions + transactions including topics with user's address (prividium)
    if (filterOptions.visibleBy && !filterOptions.address) {
      if (disableTxVisibilityByTopics) {
        // return own transactions only
        return this.queryAddressTransactions(
          filterOptions.visibleBy,
          filterOptions,
          paginationOptions,
          lastReadyBlockNumber
        );
      }

      // return transactions visible to the user for all addresses (including txs with topics with user's address)
      const innerQb = this.visibleTransactionRepository.createQueryBuilder("vt");
      innerQb.select("vt.transactionHash", "transactionHash");
      innerQb.where({ visibleBy: filterOptions.visibleBy, ...commonFilters });
      innerQb.andWhere("vt.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
      this.addDefaultOrder(innerQb);
      return this.paginateTransactions(innerQb, "transactionHash", paginationOptions);
    }

    // Case 3: viewing transactions for an arbitrary address (non prividium) or own transactions (prividium)
    if (filterOptions.address) {
      return this.queryAddressTransactions(
        filterOptions.address,
        filterOptions,
        paginationOptions,
        lastReadyBlockNumber
      );
    }

    // Case 4: no filter — all transactions (non prividium)
    const innerQb = this.transactionRepository.createQueryBuilder("transaction");
    innerQb.select("transaction.hash", "hash");
    innerQb.where(commonFilters);
    innerQb.andWhere("transaction.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    this.addDefaultOrder(innerQb);
    return this.paginateTransactions(innerQb, "hash", paginationOptions);
  }

  private async queryAddressTransactions(
    address: string,
    filterOptions: FilterTransactionsOptions,
    paginationOptions: IPaginationOptions,
    lastReadyBlockNumber: number
  ): Promise<Pagination<Transaction>> {
    const innerQb = this.addressTransactionRepository.createQueryBuilder("at");
    innerQb.select("at.transactionHash", "transactionHash");
    innerQb.where({
      address,
      ...(filterOptions.blockNumber !== undefined && { blockNumber: filterOptions.blockNumber }),
    });
    innerQb.andWhere("at.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    this.addDefaultOrder(innerQb);
    return this.paginateTransactions(innerQb, "transactionHash", paginationOptions);
  }

  private async paginateTransactions<T>(
    innerQb: SelectQueryBuilder<T>,
    fkColumn: string,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Transaction>> {
    return paginate<Transaction>({
      queryBuilder: innerQb as unknown as SelectQueryBuilder<Transaction>,
      options: paginationOptions,
      wrapQuery: async (pagedInnerQb) => {
        const outerQb = this.transactionRepository.createQueryBuilder("transaction");
        outerQb.innerJoin(
          `(${pagedInnerQb.getQuery()})`,
          "_paginated",
          `"_paginated"."${fkColumn}" = "transaction"."hash"`
        );
        outerQb.setParameters(pagedInnerQb.getParameters());
        this.addTransactionJoins(outerQb);
        copyOrderBy(pagedInnerQb, outerQb, "transaction");
        return outerQb;
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addTransactionJoins(qb: SelectQueryBuilder<any>): void {
    qb.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    qb.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
    qb.leftJoin("transaction.block", "block");
    qb.addSelect(["block.status"]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addDefaultOrder(qb: SelectQueryBuilder<any>): void {
    qb.addOrderBy(`${qb.alias}.blockNumber`, "DESC");
    qb.addOrderBy(`${qb.alias}.transactionIndex`, "DESC");
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
  ): Promise<Transaction[]> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const order = sort === SortingOrder.Asc ? "ASC" : "DESC";
    const clampedEndBlock = endBlock !== undefined ? Math.min(endBlock, lastReadyBlockNumber) : lastReadyBlockNumber;

    const innerQb = this.addressTransactionRepository.createQueryBuilder("at");
    innerQb.select("at.transactionHash", "transactionHash");
    innerQb.where({ address });
    if (startBlock !== undefined) {
      innerQb.andWhere({ blockNumber: MoreThanOrEqual(startBlock) });
    }
    innerQb.andWhere({ blockNumber: LessThanOrEqual(clampedEndBlock) });
    innerQb.orderBy("at.blockNumber", order);
    innerQb.addOrderBy("at.transactionIndex", order);
    innerQb.offset((page - 1) * offset);
    innerQb.limit(offset);

    const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");
    queryBuilder.innerJoin(
      `(${innerQb.getQuery()})`,
      "_paginated",
      `"_paginated"."transactionHash" = "transaction"."hash"`
    );
    queryBuilder.setParameters(innerQb.getParameters());
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect([
      "transactionReceipt.gasUsed",
      "transactionReceipt.cumulativeGasUsed",
      "transactionReceipt.contractAddress",
    ]);
    queryBuilder.leftJoin("transaction.block", "block");
    queryBuilder.addSelect(["block.status"]);
    queryBuilder.orderBy("transaction.blockNumber", order);
    queryBuilder.addOrderBy("transaction.transactionIndex", order);
    return await queryBuilder.getMany();
  }

  private getAccountNonceQueryBuilder(
    accountAddress: string,
    isVerified: boolean,
    lastReadyBlockNumber: number
  ): SelectQueryBuilder<Transaction> {
    const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");
    queryBuilder.select("nonce");
    queryBuilder.where({ from: accountAddress, isL1Originated: false });
    queryBuilder.andWhere("transaction.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    if (isVerified) {
      const lastVerifiedBlockQuery = this.blockRepository.createQueryBuilder("block");
      lastVerifiedBlockQuery.select("number");
      lastVerifiedBlockQuery.where("block.status = :status");
      lastVerifiedBlockQuery.andWhere("block.number <= :lastReadyBlockNumber");
      lastVerifiedBlockQuery.orderBy("block.status", "DESC");
      lastVerifiedBlockQuery.addOrderBy("block.number", "DESC");
      lastVerifiedBlockQuery.limit(1);

      queryBuilder.andWhere(`transaction.blockNumber <= (${lastVerifiedBlockQuery.getQuery()})`);
    }
    queryBuilder.orderBy("transaction.blockNumber", "DESC");
    queryBuilder.addOrderBy("transaction.nonce", "DESC");
    queryBuilder.limit(1);
    queryBuilder.setParameter("status", BlockStatus.Executed);
    return queryBuilder;
  }

  public async getAccountNonce({
    accountAddress,
    isVerified = false,
  }: {
    accountAddress: string;
    isVerified?: boolean;
  }): Promise<number> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const queryBuilder = this.getAccountNonceQueryBuilder(accountAddress, isVerified, lastReadyBlockNumber);
    const transaction = await queryBuilder.getRawOne();
    return transaction?.nonce != null ? Number(transaction.nonce) + 1 : 0;
  }

  public count(criteria: CounterCriteria<Transaction> = {}): Promise<number> {
    return this.counterService.count(Transaction, criteria);
  }

  public async isTransactionVisibleByUser(transaction: Transaction, user: UserParam): Promise<boolean> {
    // A transaction is visible by a user if:
    // - user is the sender
    // - user is the receiver
    // - user is included as part of the logs topics
    // - user's smart account produced some logs in the transaction
    if (isAddressEqual(transaction.from, user.address) || isAddressEqual(transaction.to, user.address)) {
      return true;
    }
    if (this.configService.get<boolean>("prividium.disableTxVisibilityByTopics")) {
      return false;
    }
    return (
      (await this.visibleTransactionRepository.findOne({
        where: { transactionHash: transaction.hash, visibleBy: user.address },
        select: { transactionHash: true },
      })) != null
    );
  }
}
