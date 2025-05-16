import { Test, TestingModule } from "@nestjs/testing";
import { mock, MockProxy } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as typeorm from "typeorm";
import { Brackets, SelectQueryBuilder, WhereExpressionBuilder } from "typeorm";
import { IPaginationMeta, Pagination } from "nestjs-typeorm-paginate";
import * as utils from "../common/utils";
import { SortingOrder } from "../common/types";
import { CounterService } from "../counter/counter.service";
import { FilterTransactionsOptions, TransactionService } from "./transaction.service";
import { Transaction } from "./entities/transaction.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { Batch } from "../batch/batch.entity";
import { Log } from "../log/log.entity";

jest.mock("../common/utils");

describe("TransactionService", () => {
  let transaction;
  let service: TransactionService;
  let repositoryMock: MockProxy<typeorm.Repository<Transaction>>;
  let addressTransactionRepositoryMock: MockProxy<typeorm.Repository<AddressTransaction>>;
  let batchRepositoryMock: typeorm.Repository<Batch>;
  let counterServiceMock: CounterService;
  let logRepositoryMock: MockProxy<typeorm.Repository<Log>>;
  const transactionHash = "transactionHash";

  beforeEach(async () => {
    counterServiceMock = mock<CounterService>();
    repositoryMock = mock<typeorm.Repository<Transaction>>();
    addressTransactionRepositoryMock = mock<typeorm.Repository<AddressTransaction>>();
    batchRepositoryMock = mock<typeorm.Repository<Batch>>();
    logRepositoryMock = mock<typeorm.Repository<Log>>();
    transaction = {
      hash: transactionHash,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Log),
          useValue: logRepositoryMock,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(AddressTransaction),
          useValue: addressTransactionRepositoryMock,
        },
        {
          provide: getRepositoryToken(Batch),
          useValue: batchRepositoryMock,
        },
        {
          provide: CounterService,
          useValue: counterServiceMock,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("findOne", () => {
    let queryBuilderMock;
    const hash = "txHash";

    beforeEach(() => {
      queryBuilderMock = mock<typeorm.SelectQueryBuilder<Transaction>>();
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
      (queryBuilderMock.getOne as jest.Mock).mockResolvedValue(null);
    });

    it("creates query builder with proper params", async () => {
      await service.findOne(hash);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("transaction");
    });

    it("filters transactions by the specified hash", async () => {
      await service.findOne(hash);
      expect(queryBuilderMock.where).toHaveBeenCalledWith({ hash });
    });

    it("joins batch record to get batch specific fields", async () => {
      await service.findOne(hash);
      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith("transaction.batch", "batch");
    });

    it("joins transactionReceipt record to get transactionReceipt specific fields", async () => {
      await service.findOne(hash);
      expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.transactionReceipt", "transactionReceipt");
    });

    it("selects only needed transactionReceipt fields", async () => {
      await service.findOne(hash);
      expect(queryBuilderMock.addSelect).toHaveBeenCalledWith([
        "transactionReceipt.gasUsed",
        "transactionReceipt.contractAddress",
      ]);
    });

    it("returns paginated result", async () => {
      const transaction = mock<Transaction>();
      (queryBuilderMock.getOne as jest.Mock).mockResolvedValue(transaction);

      const result = await service.findOne(hash);
      expect(result).toBe(transaction);
    });
  });

  describe("exists", () => {
    it("filters transactions by the specified hash", async () => {
      await service.exists(transactionHash);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({ where: { hash: transactionHash }, select: { hash: true } });
    });

    it("returns true if there is a transaction with the specified hash", async () => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(transaction);
      const result = await service.exists(transactionHash);
      expect(result).toBe(true);
    });

    it("returns false if there is no transaction with the specified hash", async () => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.exists(transactionHash);
      expect(result).toBe(false);
    });
  });

  describe("findAll", () => {
    let queryBuilderMock: MockProxy<SelectQueryBuilder<Transaction>>;
    let addressTransactionsQueryBuilderMock: MockProxy<SelectQueryBuilder<AddressTransaction>>;
    let logQueryBuilderMock: MockProxy<SelectQueryBuilder<Log>>;
    let filterTransactionsOptions: FilterTransactionsOptions;
    const pagingOptions = {
      filterOptions: {},
      limit: 10,
      page: 2,
    };

    beforeEach(() => {
      queryBuilderMock = mock<typeorm.SelectQueryBuilder<Transaction>>();
      addressTransactionsQueryBuilderMock = mock<typeorm.SelectQueryBuilder<AddressTransaction>>();
      logQueryBuilderMock = mock<typeorm.SelectQueryBuilder<Log>>();

      repositoryMock.createQueryBuilder.mockReturnValue(queryBuilderMock);
      addressTransactionRepositoryMock.createQueryBuilder.mockReturnValue(addressTransactionsQueryBuilderMock);
      logRepositoryMock.createQueryBuilder.mockReturnValue(logQueryBuilderMock);
    });

    describe("when address filter option is not specified", () => {
      const paginationResult = mock<Pagination<Transaction, IPaginationMeta>>();

      beforeEach(() => {
        filterTransactionsOptions = {
          blockNumber: 100,
          receivedAt: new typeorm.FindOperator("lessThanOrEqual", new Date()),
        };
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      });

      it("creates query builder with proper params", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(repositoryMock.createQueryBuilder).toHaveBeenNthCalledWith(1, "transaction");
      });

      it("filters transactions by the specified options", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.where).toHaveBeenCalledWith(filterTransactionsOptions);
      });

      it("joins transactionReceipt record to get receipt specific fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.transactionReceipt", "transactionReceipt");
      });

      it("selects only needed transactionReceipt fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transactionReceipt.gasUsed",
          "transactionReceipt.contractAddress",
        ]);
      });

      it("joins batch record to get batch specific fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.batch", "batch");
      });

      it("selects only needed batch fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith([
          "batch.commitTxHash",
          "batch.executeTxHash",
          "batch.proveTxHash",
        ]);
      });

      it("orders transactions by blockNumber, receivedAt and transactionIndex DESC", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transaction.blockNumber", "DESC");
        expect(queryBuilderMock.addOrderBy).toBeCalledTimes(2);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.receivedAt", "DESC");
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.transactionIndex", "DESC");
      });

      it("returns paginated result", async () => {
        const result = await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(utils.paginate).toBeCalledTimes(1);
        expect(utils.paginate).toBeCalledWith(queryBuilderMock, pagingOptions);
        expect(result).toBe(paginationResult);
      });
    });

    describe("when address filter option is specified", () => {
      const paginationResult = mock<Pagination<AddressTransaction, IPaginationMeta>>({
        items: [
          {
            transaction: mock<Transaction>(),
          },
          {
            transaction: mock<Transaction>(),
          },
        ],
      });

      beforeEach(() => {
        filterTransactionsOptions = {
          address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        };
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      });

      it("creates query builder with proper params", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("sub1_addressTransaction");
      });

      it("joins transaction records", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.innerJoin).toBeCalledTimes(1);
        expect(addressTransactionsQueryBuilderMock.innerJoin).toHaveBeenCalledWith(
          "sub1_addressTransaction.transaction",
          "sub1_transaction"
        );
      });

      it("joins transactionReceipt record to get receipt specific fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.transactionReceipt", "transactionReceipt");
      });

      it("selects only needed transactionReceipt fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transactionReceipt.gasUsed",
          "transactionReceipt.contractAddress",
        ]);
      });

      it("joins batch records", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.batch", "batch");
      });

      it("filters transactions by the specified options when only address is defined", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.where).toHaveBeenCalledWith(
          "sub1_addressTransaction.address = :address"
        );

        expect(addressTransactionsQueryBuilderMock.andWhere).not.toHaveBeenCalledWith(
          "sub1_transaction.blockNumber = :blockNumber"
        );
        expect(addressTransactionsQueryBuilderMock.andWhere).not.toHaveBeenCalledWith(
          "sub1_transaction.l1BatchNumber = :l1BatchNumber"
        );
        expect(addressTransactionsQueryBuilderMock.andWhere).not.toHaveBeenCalledWith(
          "sub1_transaction.receivedAt <= :receivedAt"
        );
      });

      it("filters transactions by the specified options when additional filters are defined", async () => {
        const filterOptions = {
          address: "address",
          blockNumber: 100,
          l1BatchNumber: 10,
          receivedAt: new typeorm.FindOperator("lessThanOrEqual", new Date()),
        };
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.where).toHaveBeenCalledWith(
          "sub1_addressTransaction.address = :address"
        );
        expect(addressTransactionsQueryBuilderMock.andWhere).toHaveBeenCalledWith(
          "sub1_transaction.blockNumber = :blockNumber"
        );
        expect(addressTransactionsQueryBuilderMock.andWhere).toHaveBeenCalledWith(
          "sub1_transaction.l1BatchNumber = :l1BatchNumber"
        );
        expect(addressTransactionsQueryBuilderMock.andWhere).toHaveBeenCalledWith(
          "sub1_transaction.receivedAt <= :receivedAt"
        );
      });

      it("selects only needed batch fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith([
          "batch.commitTxHash",
          "batch.executeTxHash",
          "batch.proveTxHash",
        ]);
      });

      it("orders transactions by blockNumber, receivedAt and transactionIndex DESC", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transaction.blockNumber", "DESC");
        expect(queryBuilderMock.addOrderBy).toBeCalledTimes(2);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.receivedAt", "DESC");
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.transactionIndex", "DESC");
      });

      it("returns paginated result", async () => {
        const result = await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(utils.paginate).toBeCalledTimes(1);
        expect(utils.paginate).toBeCalledWith(queryBuilderMock, pagingOptions);
        expect(result.items).toEqual(paginationResult.items);
      });

      it("filters by log when filterAddressInLogTopics is true", async () => {
        filterTransactionsOptions.filterAddressInLogTopics = true;
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(logRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("sub2_log");
        expect(logQueryBuilderMock.select).toHaveBeenCalledWith("sub2_log.transactionHash");
        expect(logQueryBuilderMock.innerJoin).toHaveBeenCalledWith("sub2_log.transaction", "sub2_transaction");
        expect(logQueryBuilderMock.where).toHaveBeenCalledWith(expect.any(Brackets));
        const brackets = logQueryBuilderMock.where.mock.calls[0][0] as Brackets;
        const qb = mock<WhereExpressionBuilder>();
        brackets.whereFactory(qb);
        expect(qb.where).toHaveBeenCalledWith("sub2_log.topics[1] = :paddedAddressBytes");
        expect(qb.orWhere).toHaveBeenCalledWith("sub2_log.topics[2] = :paddedAddressBytes");
        expect(qb.orWhere).toHaveBeenCalledWith("sub2_log.topics[3] = :paddedAddressBytes");
      });

      it("filters by and block number", async () => {
        filterTransactionsOptions.filterAddressInLogTopics = true;
        filterTransactionsOptions.blockNumber = 10;
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(logQueryBuilderMock.andWhere).toHaveBeenCalledWith("sub2_transaction.blockNumber = :blockNumber");
      });

      it("filters by and batch number", async () => {
        filterTransactionsOptions.filterAddressInLogTopics = true;
        filterTransactionsOptions.l1BatchNumber = 10;
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(logQueryBuilderMock.andWhere).toHaveBeenCalledWith("sub2_transaction.l1BatchNumber = :l1BatchNumber");
      });

      it("filters by and receivedAt", async () => {
        filterTransactionsOptions.filterAddressInLogTopics = true;
        filterTransactionsOptions.receivedAt = typeorm.LessThanOrEqual(new Date());
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(logQueryBuilderMock.andWhere).toHaveBeenCalledWith("sub2_transaction.receivedAt <= :receivedAt");
      });

      it("can filter between", async () => {
        const date1 = new Date();
        const date2 = new Date();
        const filterOptions = {
          address: "address",
          receivedAt: typeorm.Between(date1, date2),
        };
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.andWhere).toHaveBeenCalledWith(
          "sub1_transaction.receivedAt BETWEEN :receivedAtStart AND :receivedAtEnd"
        );
      });

      it("can filter by more than", async () => {
        const date1 = new Date();
        const filterOptions = {
          address: "address",
          receivedAt: typeorm.MoreThanOrEqual(date1),
        };
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.andWhere).toHaveBeenCalledWith(
          "sub1_transaction.receivedAt >= :receivedAt"
        );
      });

      it("can filter by less than", async () => {
        const date1 = new Date();
        const filterOptions = {
          address: "address",
          receivedAt: typeorm.LessThanOrEqual(date1),
        };
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.andWhere).toHaveBeenCalledWith(
          "sub1_transaction.receivedAt <= :receivedAt"
        );
      });

      it("cannot filter by strict less", async () => {
        const date1 = new Date();
        const filterOptions = {
          address: "address",
          receivedAt: typeorm.LessThan(date1),
        };
        await expect(() => service.findAll(filterOptions, pagingOptions)).rejects.toThrow();
      });

      it("can also filter by block number", async () => {
        const filterOptions = {
          address: "address",
          blockNumber: 10,
        };
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.andWhere).toHaveBeenCalledWith(
          "sub1_transaction.blockNumber = :blockNumber"
        );
      });

      it("can also filter by block number", async () => {
        const filterOptions = {
          address: "address",
          l1BatchNumber: 10,
        };
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.andWhere).toHaveBeenCalledWith(
          "sub1_transaction.l1BatchNumber = :l1BatchNumber"
        );
      });
    });
  });

  describe("findByAddress", () => {
    let addressTransactionsQueryBuilderMock;

    beforeEach(() => {
      addressTransactionsQueryBuilderMock = mock<typeorm.SelectQueryBuilder<AddressTransaction>>({
        getMany: jest.fn().mockResolvedValue([]),
      });
      (addressTransactionRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(
        addressTransactionsQueryBuilderMock
      );
    });

    it("creates query builder with proper params", async () => {
      await service.findByAddress("address");
      expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("addressTransaction");
    });

    it("selects address transactions number", async () => {
      await service.findByAddress("address");
      expect(addressTransactionsQueryBuilderMock.select).toBeCalledTimes(1);
      expect(addressTransactionsQueryBuilderMock.select).toHaveBeenCalledWith("addressTransaction.number");
    });

    it("joins transaction records", async () => {
      await service.findByAddress("address");
      expect(addressTransactionsQueryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
      expect(addressTransactionsQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        "addressTransaction.transaction",
        "transaction"
      );
    });

    it("joins transactionReceipt records", async () => {
      await service.findByAddress("address");
      expect(addressTransactionsQueryBuilderMock.leftJoin).toHaveBeenCalledWith(
        "transaction.transactionReceipt",
        "transactionReceipt"
      );
      expect(addressTransactionsQueryBuilderMock.addSelect).toBeCalledWith([
        "transactionReceipt.gasUsed",
        "transactionReceipt.cumulativeGasUsed",
        "transactionReceipt.contractAddress",
      ]);
    });

    it("joins batch records", async () => {
      await service.findByAddress("address");
      expect(addressTransactionsQueryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
      expect(addressTransactionsQueryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.batch", "batch");
    });

    it("filters transactions by the specified address", async () => {
      await service.findByAddress("address");
      expect(addressTransactionsQueryBuilderMock.where).toHaveBeenCalledWith({ address: "address" });
    });

    it("filters transactions by the specified options when block filters are defined", async () => {
      const filterOptions = {
        startBlock: 100,
        endBlock: 200,
      };
      await service.findByAddress("address", filterOptions);
      expect(addressTransactionsQueryBuilderMock.andWhere).toBeCalledWith({
        blockNumber: typeorm.MoreThanOrEqual(filterOptions.startBlock),
      });
      expect(addressTransactionsQueryBuilderMock.andWhere).toBeCalledWith({
        blockNumber: typeorm.LessThanOrEqual(filterOptions.endBlock),
      });
    });

    it("selects only needed batch fields", async () => {
      await service.findByAddress("address");
      expect(addressTransactionsQueryBuilderMock.addSelect).toHaveBeenCalledWith([
        "batch.commitTxHash",
        "batch.executeTxHash",
        "batch.proveTxHash",
      ]);
    });

    it("orders transactions by blockNumber, receivedAt and transactionIndex", async () => {
      await service.findByAddress("address", {
        page: 10,
        offset: 100,
        sort: SortingOrder.Asc,
      });
      expect(addressTransactionsQueryBuilderMock.orderBy).toBeCalledTimes(1);
      expect(addressTransactionsQueryBuilderMock.orderBy).toHaveBeenCalledWith("addressTransaction.blockNumber", "ASC");
      expect(addressTransactionsQueryBuilderMock.addOrderBy).toBeCalledTimes(2);
      expect(addressTransactionsQueryBuilderMock.addOrderBy).toHaveBeenCalledWith(
        "addressTransaction.receivedAt",
        "ASC"
      );
      expect(addressTransactionsQueryBuilderMock.addOrderBy).toHaveBeenCalledWith(
        "addressTransaction.transactionIndex",
        "ASC"
      );
    });

    it("sets offset and limit", async () => {
      await service.findByAddress("address", {
        page: 10,
        offset: 100,
      });
      expect(addressTransactionsQueryBuilderMock.offset).toBeCalledTimes(1);
      expect(addressTransactionsQueryBuilderMock.offset).toHaveBeenCalledWith(900);
      expect(addressTransactionsQueryBuilderMock.limit).toBeCalledTimes(1);
      expect(addressTransactionsQueryBuilderMock.limit).toHaveBeenCalledWith(100);
    });

    it("returns list of transactions", async () => {
      const result = await service.findByAddress("address");
      expect(addressTransactionsQueryBuilderMock.getMany).toBeCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe("getAccountNonce", () => {
    let queryBuilderMock;
    let batchQueryBuilderMock;
    const address = "address";
    const transaction = {
      nonce: "10",
    };

    describe("when isVerified is falsy", () => {
      beforeEach(() => {
        queryBuilderMock = mock<typeorm.SelectQueryBuilder<Transaction>>();

        (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
        (queryBuilderMock.getRawOne as jest.Mock).mockResolvedValue(transaction);
      });

      it("creates query builder with proper params", async () => {
        await service.getAccountNonce({ accountAddress: address });
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("transaction");
      });

      it("selects transaction nonce", async () => {
        await service.getAccountNonce({ accountAddress: address });
        expect(queryBuilderMock.select).toHaveBeenCalledWith("nonce");
      });

      it("filters transactions by the specified address and isL1Originated", async () => {
        await service.getAccountNonce({ accountAddress: address });
        expect(queryBuilderMock.where).toHaveBeenCalledWith({ from: address, isL1Originated: false });
      });

      it("orders by batch number then by nonce", async () => {
        await service.getAccountNonce({ accountAddress: address });
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transaction.l1BatchNumber", "DESC");
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.nonce", "DESC");
      });

      it("limits result to 1 item", async () => {
        await service.getAccountNonce({ accountAddress: address });
        expect(queryBuilderMock.limit).toHaveBeenCalledWith(1);
      });

      it("returns transaction nonce + 1", async () => {
        const result = await service.getAccountNonce({ accountAddress: address, isVerified: false });
        expect(queryBuilderMock.getRawOne).toHaveBeenCalledTimes(1);
        expect(result).toBe(11);
      });

      describe("when there are no transactions", () => {
        beforeEach(() => {
          (queryBuilderMock.getRawOne as jest.Mock).mockResolvedValue(null);
        });

        it("returns 0", async () => {
          const result = await service.getAccountNonce({ accountAddress: address });
          expect(queryBuilderMock.getRawOne).toHaveBeenCalledTimes(1);
          expect(result).toBe(0);
        });
      });

      describe("when there are no transactions with not nullable nonce", () => {
        beforeEach(() => {
          (queryBuilderMock.getRawOne as jest.Mock).mockResolvedValue({
            nonce: null,
          });
        });

        it("returns 0", async () => {
          const result = await service.getAccountNonce({ accountAddress: address });
          expect(queryBuilderMock.getRawOne).toHaveBeenCalledTimes(1);
          expect(result).toBe(0);
        });
      });
    });

    describe("when isVerified is truthy", () => {
      beforeEach(() => {
        queryBuilderMock = mock<typeorm.SelectQueryBuilder<Transaction>>();
        batchQueryBuilderMock = mock<typeorm.SelectQueryBuilder<Batch>>();

        (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
        (batchRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(batchQueryBuilderMock);
        (queryBuilderMock.getRawOne as jest.Mock).mockResolvedValue(transaction);
        (batchQueryBuilderMock.getQuery as jest.Mock).mockReturnValue("executed batch query");
      });

      it("creates query builders with proper params", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("transaction");
        expect(batchRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(batchRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("batch");
      });

      it("selects transaction nonce", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(queryBuilderMock.select).toHaveBeenCalledWith("nonce");
      });

      it("filters transactions by the specified address and isL1Originated", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(queryBuilderMock.where).toHaveBeenCalledWith({ from: address, isL1Originated: false });
      });

      it("filters transactions by batch number <= last executed batch", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(batchQueryBuilderMock.select).toHaveBeenCalledWith("number");
        expect(batchQueryBuilderMock.where).toHaveBeenCalledWith("batch.executedAt IS NOT NULL");
        expect(batchQueryBuilderMock.orderBy).toHaveBeenCalledWith("batch.executedAt", "DESC");
        expect(batchQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("batch.number", "DESC");
        expect(batchQueryBuilderMock.limit).toHaveBeenCalledWith(1);
        expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("transaction.l1BatchNumber <= (executed batch query)");
      });

      it("orders by batch number then by nonce", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transaction.l1BatchNumber", "DESC");
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.nonce", "DESC");
      });

      it("limits result to 1 item", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(queryBuilderMock.limit).toHaveBeenCalledWith(1);
      });

      it("returns transaction nonce + 1", async () => {
        const result = await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(queryBuilderMock.getRawOne).toHaveBeenCalledTimes(1);
        expect(result).toBe(11);
      });

      describe("when there are no transactions", () => {
        beforeEach(() => {
          (queryBuilderMock.getRawOne as jest.Mock).mockResolvedValue(null);
        });

        it("returns 0", async () => {
          const result = await service.getAccountNonce({ accountAddress: address, isVerified: true });
          expect(queryBuilderMock.getRawOne).toHaveBeenCalledTimes(1);
          expect(result).toBe(0);
        });
      });

      describe("when there are no transactions with not nullable nonce", () => {
        beforeEach(() => {
          (queryBuilderMock.getRawOne as jest.Mock).mockResolvedValue({
            nonce: null,
          });
        });

        it("returns 0", async () => {
          const result = await service.getAccountNonce({ accountAddress: address, isVerified: true });
          expect(queryBuilderMock.getRawOne).toHaveBeenCalledTimes(1);
          expect(result).toBe(0);
        });
      });
    });
  });

  describe("count", () => {
    beforeEach(() => {
      (counterServiceMock.count as jest.Mock).mockResolvedValue(10);
    });

    describe("when where condition is not specified", () => {
      it("calls counter service count without where condition and returns result", async () => {
        await service.count();
        expect(counterServiceMock.count).toHaveBeenCalledTimes(1);
        expect(counterServiceMock.count).toHaveBeenCalledWith(Transaction, {});
      });
    });

    describe("when where condition is specified", () => {
      it("calls counter service count with where condition and returns result", async () => {
        await service.count({ from: "addr1" });
        expect(counterServiceMock.count).toHaveBeenCalledTimes(1);
        expect(counterServiceMock.count).toHaveBeenCalledWith(Transaction, { from: "addr1" });
      });
    });
  });
});
