import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOperator, LessThanOrEqual, MoreThanOrEqual, Repository, SelectQueryBuilder } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { isAddressEqual, paginate, computeFromToMinMax } from "../common/utils";
import { CounterCriteria, IPaginationOptions, SortingOrder } from "../common/types";
import { Transaction } from "./entities/transaction.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { VisibleTransaction } from "./entities/visibleTransaction.entity";
import { AddressVisibleTransaction } from "./entities/addressVisibleTransaction.entity";
import { Block, BlockStatus } from "../block/block.entity";
import { CounterService } from "../counter/counter.service";
import { UserParam } from "../user/user.decorator";

export interface FilterTransactionsOptions {
  blockNumber?: number;
  address?: string;
  receivedAt?: FindOperator<Date>;
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
    private readonly configService: ConfigService
  ) {}

  public async findOne(hash: string): Promise<Transaction> {
    const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");
    queryBuilder.leftJoinAndSelect("transaction.block", "block");
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
    const disableTxVisibilityByTopics = this.configService.get<boolean>("prividium.disableTxVisibilityByTopics");
    const commonFilters = {
      ...(filterOptions.receivedAt && { receivedAt: filterOptions.receivedAt }),
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
        const qb = this.transactionRepository.createQueryBuilder("transaction");
        this.addTransactionJoins(qb);
        qb.where({
          fromToMin,
          fromToMax,
          ...commonFilters,
        });
        this.addDefaultOrder(qb, "transaction");
        return await paginate<Transaction>(qb, paginationOptions);
      }

      // query transactions visible to the user for the address (including topics with user's address)
      const qb = this.addressVisibleTransactionRepository.createQueryBuilder("addressVisibleTransaction");
      qb.select("addressVisibleTransaction.number");
      qb.leftJoinAndSelect("addressVisibleTransaction.transaction", "transaction");
      this.addTransactionJoins(qb);
      qb.where({
        address: filterOptions.address,
        visibleBy: filterOptions.visibleBy,
        ...commonFilters,
      });
      this.addDefaultOrder(qb, "addressVisibleTransaction");
      return this.unwrapTransactions(await paginate<AddressVisibleTransaction>(qb, paginationOptions));
    }

    // Case 2: all transactions visible to a user - own transactions + transactions including topics with user's address (prividium)
    if (filterOptions.visibleBy && !filterOptions.address) {
      if (disableTxVisibilityByTopics) {
        // return own transactions only
        return this.queryAddressTransactions(filterOptions.visibleBy, filterOptions, paginationOptions);
      }

      // return transactions visible to the user for all addresses (including txs with topics with user's address)
      const qb = this.visibleTransactionRepository.createQueryBuilder("visibleTransaction");
      qb.select("visibleTransaction.number");
      qb.leftJoinAndSelect("visibleTransaction.transaction", "transaction");
      this.addTransactionJoins(qb);
      qb.where({
        visibleBy: filterOptions.visibleBy,
        ...commonFilters,
      });
      this.addDefaultOrder(qb, "visibleTransaction");
      return this.unwrapTransactions(await paginate<VisibleTransaction>(qb, paginationOptions));
    }

    // Case 3: viewing transactions for an arbitrary address (non prividium) or own transactions (prividium)
    if (filterOptions.address) {
      return this.queryAddressTransactions(filterOptions.address, filterOptions, paginationOptions);
    }

    // Case 4: no filter — all transactions (non prividium)
    const qb = this.transactionRepository.createQueryBuilder("transaction");
    this.addTransactionJoins(qb);
    qb.where(commonFilters);
    this.addDefaultOrder(qb, "transaction");
    return await paginate<Transaction>(qb, paginationOptions);
  }

  private async queryAddressTransactions(
    address: string,
    filterOptions: FilterTransactionsOptions,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Transaction>> {
    const qb = this.addressTransactionRepository.createQueryBuilder("addressTransaction");
    qb.select("addressTransaction.number");
    qb.leftJoinAndSelect("addressTransaction.transaction", "transaction");
    this.addTransactionJoins(qb);
    qb.where({
      address,
      ...(filterOptions.receivedAt && { receivedAt: filterOptions.receivedAt }),
      ...(filterOptions.blockNumber !== undefined && { blockNumber: filterOptions.blockNumber }),
    });
    this.addDefaultOrder(qb, "addressTransaction");
    return this.unwrapTransactions(await paginate<AddressTransaction>(qb, paginationOptions));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addTransactionJoins(qb: SelectQueryBuilder<any>): void {
    qb.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    qb.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
    qb.leftJoin("transaction.block", "block");
    qb.addSelect(["block.status"]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addDefaultOrder(qb: SelectQueryBuilder<any>, alias: string): void {
    qb.addOrderBy(`${alias}.receivedAt`, "DESC");
    qb.addOrderBy(`${alias}.transactionIndex`, "DESC");
  }

  private unwrapTransactions<T extends { transaction: Transaction }>(results: Pagination<T>): Pagination<Transaction> {
    return { ...results, items: results.items.map((item) => item.transaction) };
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
    queryBuilder.leftJoin("transaction.block", "block");
    queryBuilder.addSelect(["block.status"]);
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
      const lastVerifiedBlockQuery = this.blockRepository.createQueryBuilder("block");
      lastVerifiedBlockQuery.select("number");
      lastVerifiedBlockQuery.where("block.status = :status");
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
    const queryBuilder = this.getAccountNonceQueryBuilder(accountAddress, isVerified);
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
