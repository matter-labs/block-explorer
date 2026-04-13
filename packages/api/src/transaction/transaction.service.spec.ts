import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as typeorm from "typeorm";
import { Pagination, IPaginationMeta } from "nestjs-typeorm-paginate";
import * as utils from "../common/utils";
import { SortingOrder } from "../common/types";
import { CounterService } from "../counter/counter.service";
import { TransactionService, FilterTransactionsOptions } from "./transaction.service";
import { Transaction } from "./entities/transaction.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { VisibleTransaction } from "./entities/visibleTransaction.entity";
import { AddressVisibleTransaction } from "./entities/addressVisibleTransaction.entity";
import { Block } from "../block/block.entity";
import { ConfigService } from "@nestjs/config";

jest.mock("../common/utils", () => ({
  ...jest.requireActual("../common/utils"),
  paginate: jest.fn(),
}));

describe("TransactionService", () => {
  let transaction;
  let service: TransactionService;
  let repositoryMock: typeorm.Repository<Transaction>;
  let addressTransactionRepositoryMock: typeorm.Repository<AddressTransaction>;
  let visibleTransactionRepositoryMock: typeorm.Repository<VisibleTransaction>;
  let addressVisibleTransactionRepositoryMock: typeorm.Repository<AddressVisibleTransaction>;
  let blockRepositoryMock: typeorm.Repository<Block>;
  let counterServiceMock: CounterService;
  const transactionHash = "transactionHash";

  let configServiceMock: ConfigService;

  beforeEach(async () => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(false),
    });
    counterServiceMock = mock<CounterService>();
    repositoryMock = mock<typeorm.Repository<Transaction>>();
    addressTransactionRepositoryMock = mock<typeorm.Repository<AddressTransaction>>();
    visibleTransactionRepositoryMock = mock<typeorm.Repository<VisibleTransaction>>();
    addressVisibleTransactionRepositoryMock = mock<typeorm.Repository<AddressVisibleTransaction>>();
    blockRepositoryMock = mock<typeorm.Repository<Block>>();
    transaction = {
      hash: transactionHash,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(AddressTransaction),
          useValue: addressTransactionRepositoryMock,
        },
        {
          provide: getRepositoryToken(VisibleTransaction),
          useValue: visibleTransactionRepositoryMock,
        },
        {
          provide: getRepositoryToken(AddressVisibleTransaction),
          useValue: addressVisibleTransactionRepositoryMock,
        },
        {
          provide: getRepositoryToken(Block),
          useValue: blockRepositoryMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
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

    it("joins block record to get block specific fields", async () => {
      await service.findOne(hash);
      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith("transaction.block", "block");
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
    let queryBuilderMock;
    let filterTransactionsOptions: FilterTransactionsOptions;
    const pagingOptions = {
      filterOptions: {},
      limit: 10,
      page: 2,
    };

    beforeEach(() => {
      queryBuilderMock = mock<typeorm.SelectQueryBuilder<Transaction>>();
      queryBuilderMock.alias = "transaction";
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
    });

    describe("when no address and no visibleBy", () => {
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
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("transaction");
      });

      it("selects transaction hash", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.select).toHaveBeenCalledWith("transaction.hash", "hash");
      });

      it("filters transactions by the specified options", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.where).toHaveBeenCalledWith({
          blockNumber: filterTransactionsOptions.blockNumber,
          receivedAt: filterTransactionsOptions.receivedAt,
        });
      });

      it("orders by receivedAt and transactionIndex DESC", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.receivedAt", "DESC");
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.transactionIndex", "DESC");
      });

      it("returns paginated result with wrapQuery", async () => {
        const result = await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(utils.paginate).toBeCalledWith({
          queryBuilder: queryBuilderMock,
          options: pagingOptions,
          wrapQuery: expect.any(Function),
        });
        expect(result).toBe(paginationResult);
      });

      it("wrapQuery builds outer query with transaction joins", async () => {
        let outerQbMock;
        (utils.paginate as jest.Mock).mockImplementation(async ({ wrapQuery }) => {
          const pagedInnerQbMock = mock<typeorm.SelectQueryBuilder<Transaction>>({
            getQuery: jest.fn().mockReturnValue("inner SQL"),
            getParameters: jest.fn().mockReturnValue({ p1: "v1" }),
          });
          Object.defineProperty(pagedInnerQbMock, "expressionMap", {
            value: { orderBys: { "transaction.receivedAt": "DESC" } },
          });

          outerQbMock = mock<typeorm.SelectQueryBuilder<Transaction>>();
          (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(outerQbMock);

          await wrapQuery(pagedInnerQbMock);
          return { items: [] };
        });

        await service.findAll(filterTransactionsOptions, pagingOptions);

        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("transaction");
        expect(outerQbMock.innerJoin).toHaveBeenCalledWith(
          "(inner SQL)",
          "_paginated",
          `"_paginated"."hash" = "transaction"."hash"`
        );
        expect(outerQbMock.setParameters).toHaveBeenCalledWith({ p1: "v1" });
        expect(outerQbMock.leftJoin).toHaveBeenCalledWith("transaction.transactionReceipt", "transactionReceipt");
        expect(outerQbMock.addSelect).toHaveBeenCalledWith([
          "transactionReceipt.gasUsed",
          "transactionReceipt.contractAddress",
        ]);
        expect(outerQbMock.leftJoin).toHaveBeenCalledWith("transaction.block", "block");
        expect(outerQbMock.addSelect).toHaveBeenCalledWith(["block.status"]);
        expect(outerQbMock.addOrderBy).toHaveBeenCalledWith("transaction.receivedAt", "DESC");
      });
    });

    describe("when address filter option is specified without visibleBy", () => {
      const paginationResult = mock<Pagination<Transaction, IPaginationMeta>>();
      let addressTransactionQbMock;

      beforeEach(() => {
        filterTransactionsOptions = { address: "address" };
        addressTransactionQbMock = mock<typeorm.SelectQueryBuilder<AddressTransaction>>();
        addressTransactionQbMock.alias = "at";
        (addressTransactionRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(addressTransactionQbMock);
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      });

      it("creates query builder on addressTransactionRepository", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("at");
      });

      it("selects transactionHash", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionQbMock.select).toHaveBeenCalledWith("at.transactionHash", "transactionHash");
      });

      it("filters with address", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionQbMock.where).toHaveBeenCalledWith({ address: "address" });
      });

      it("filters with additional filters", async () => {
        const filterOptions = {
          address: "address",
          blockNumber: 100,
          receivedAt: new typeorm.FindOperator("lessThanOrEqual", new Date()),
        };
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransactionQbMock.where).toHaveBeenCalledWith({
          address: filterOptions.address,
          receivedAt: filterOptions.receivedAt,
          blockNumber: filterOptions.blockNumber,
        });
      });

      it("orders by at receivedAt and transactionIndex DESC", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionQbMock.addOrderBy).toHaveBeenCalledWith("at.receivedAt", "DESC");
        expect(addressTransactionQbMock.addOrderBy).toHaveBeenCalledWith("at.transactionIndex", "DESC");
      });

      it("returns paginated result with wrapQuery", async () => {
        const result = await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(utils.paginate).toBeCalledWith({
          queryBuilder: addressTransactionQbMock,
          options: pagingOptions,
          wrapQuery: expect.any(Function),
        });
        expect(result).toBe(paginationResult);
      });
    });

    describe("when visibleBy is set without address", () => {
      const visibleBy = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

      describe("when disableTxVisibilityByTopics is false", () => {
        const paginationResult = mock<Pagination<Transaction, IPaginationMeta>>();
        let visibleTransactionQbMock;

        beforeEach(() => {
          filterTransactionsOptions = { visibleBy };
          visibleTransactionQbMock = mock<typeorm.SelectQueryBuilder<VisibleTransaction>>();
          visibleTransactionQbMock.alias = "vt";
          (visibleTransactionRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(visibleTransactionQbMock);
          (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        });

        it("creates query builder on visibleTransactionRepository", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(visibleTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("vt");
        });

        it("selects transactionHash", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(visibleTransactionQbMock.select).toHaveBeenCalledWith("vt.transactionHash", "transactionHash");
        });

        it("filters with visibleBy", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(visibleTransactionQbMock.where).toHaveBeenCalledWith({ visibleBy });
        });

        it("orders by vt receivedAt and transactionIndex DESC", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(visibleTransactionQbMock.addOrderBy).toHaveBeenCalledWith("vt.receivedAt", "DESC");
          expect(visibleTransactionQbMock.addOrderBy).toHaveBeenCalledWith("vt.transactionIndex", "DESC");
        });

        it("returns paginated result with wrapQuery", async () => {
          const result = await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(utils.paginate).toBeCalledWith({
            queryBuilder: visibleTransactionQbMock,
            options: pagingOptions,
            wrapQuery: expect.any(Function),
          });
          expect(result).toBe(paginationResult);
        });
      });

      describe("when disableTxVisibilityByTopics is true", () => {
        const paginationResult = mock<Pagination<Transaction, IPaginationMeta>>();
        let addressTransactionQbMock;

        beforeEach(() => {
          (configServiceMock.get as jest.Mock).mockReturnValue(true);
          filterTransactionsOptions = { visibleBy };
          addressTransactionQbMock = mock<typeorm.SelectQueryBuilder<AddressTransaction>>();
          addressTransactionQbMock.alias = "at";
          (addressTransactionRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(addressTransactionQbMock);
          (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        });

        it("uses addressTransactionRepository", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("at");
        });

        it("filters by visibleBy as address", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressTransactionQbMock.where).toHaveBeenCalledWith({ address: visibleBy });
        });
      });
    });

    describe("when visibleBy and address are both set and differ", () => {
      const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const visibleBy = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

      describe("when disableTxVisibilityByTopics is false", () => {
        const paginationResult = mock<Pagination<Transaction, IPaginationMeta>>();
        let addressVisibleTransactionQbMock;

        beforeEach(() => {
          filterTransactionsOptions = { address, visibleBy };
          addressVisibleTransactionQbMock = mock<typeorm.SelectQueryBuilder<AddressVisibleTransaction>>();
          addressVisibleTransactionQbMock.alias = "avt";
          (addressVisibleTransactionRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(
            addressVisibleTransactionQbMock
          );
          (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        });

        it("creates query builder on addressVisibleTransactionRepository", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressVisibleTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("avt");
        });

        it("selects transactionHash", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressVisibleTransactionQbMock.select).toHaveBeenCalledWith("avt.transactionHash", "transactionHash");
        });

        it("filters with address and visibleBy", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressVisibleTransactionQbMock.where).toHaveBeenCalledWith({
            address,
            visibleBy,
          });
        });

        it("orders by avt receivedAt and transactionIndex DESC", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressVisibleTransactionQbMock.addOrderBy).toHaveBeenCalledWith("avt.receivedAt", "DESC");
          expect(addressVisibleTransactionQbMock.addOrderBy).toHaveBeenCalledWith("avt.transactionIndex", "DESC");
        });

        it("returns paginated result with wrapQuery", async () => {
          const result = await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(utils.paginate).toBeCalledWith({
            queryBuilder: addressVisibleTransactionQbMock,
            options: pagingOptions,
            wrapQuery: expect.any(Function),
          });
          expect(result).toBe(paginationResult);
        });
      });

      describe("when disableTxVisibilityByTopics is true", () => {
        const paginationResult = mock<Pagination<Transaction, IPaginationMeta>>();

        beforeEach(() => {
          (configServiceMock.get as jest.Mock).mockReturnValue(true);
          filterTransactionsOptions = { address, visibleBy };
          (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        });

        it("uses transactionRepository with fromToMin/fromToMax", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("transaction");
        });

        it("filters by fromToMin and fromToMax", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(queryBuilderMock.where).toHaveBeenCalledWith(
            expect.objectContaining({
              fromToMin: visibleBy,
              fromToMax: address,
            })
          );
        });

        it("orders by transaction receivedAt and transactionIndex DESC", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.receivedAt", "DESC");
          expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.transactionIndex", "DESC");
        });

        it("returns paginated result", async () => {
          const result = await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(utils.paginate).toBeCalledWith({
            queryBuilder: queryBuilderMock,
            options: pagingOptions,
            wrapQuery: expect.any(Function),
          });
          expect(result).toBe(paginationResult);
        });
      });
    });
  });

  describe("findByAddress", () => {
    let innerQueryBuilderMock;
    let outerQueryBuilderMock;

    beforeEach(() => {
      innerQueryBuilderMock = mock<typeorm.SelectQueryBuilder<AddressTransaction>>({
        getQuery: jest.fn().mockReturnValue("inner query"),
        getParameters: jest.fn().mockReturnValue({}),
      });
      outerQueryBuilderMock = mock<typeorm.SelectQueryBuilder<Transaction>>({
        getMany: jest.fn().mockResolvedValue([]),
      });
      (addressTransactionRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(innerQueryBuilderMock);
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(outerQueryBuilderMock);
    });

    it("creates inner query builder on addressTransactionRepository", async () => {
      await service.findByAddress("address");
      expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("at");
    });

    it("creates outer query builder on transactionRepository", async () => {
      await service.findByAddress("address");
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("transaction");
    });

    it("inner query selects transactionHash", async () => {
      await service.findByAddress("address");
      expect(innerQueryBuilderMock.select).toHaveBeenCalledWith("at.transactionHash", "transactionHash");
    });

    it("inner query filters by address", async () => {
      await service.findByAddress("address");
      expect(innerQueryBuilderMock.where).toHaveBeenCalledWith({ address: "address" });
    });

    it("inner query applies block filters", async () => {
      await service.findByAddress("address", { startBlock: 100, endBlock: 200 });
      expect(innerQueryBuilderMock.andWhere).toBeCalledWith({
        blockNumber: typeorm.MoreThanOrEqual(100),
      });
      expect(innerQueryBuilderMock.andWhere).toBeCalledWith({
        blockNumber: typeorm.LessThanOrEqual(200),
      });
    });

    it("inner query sets offset and limit", async () => {
      await service.findByAddress("address", { page: 10, offset: 100 });
      expect(innerQueryBuilderMock.offset).toHaveBeenCalledWith(900);
      expect(innerQueryBuilderMock.limit).toHaveBeenCalledWith(100);
    });

    it("inner query orders by blockNumber and transactionIndex", async () => {
      await service.findByAddress("address", { sort: SortingOrder.Asc });
      expect(innerQueryBuilderMock.orderBy).toHaveBeenCalledWith("at.blockNumber", "ASC");
      expect(innerQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("at.transactionIndex", "ASC");
    });

    it("outer query joins via inner subquery", async () => {
      await service.findByAddress("address");
      expect(outerQueryBuilderMock.innerJoin).toHaveBeenCalledWith(
        "(inner query)",
        "_paginated",
        `"_paginated"."transactionHash" = "transaction"."hash"`
      );
      expect(outerQueryBuilderMock.setParameters).toHaveBeenCalledWith({});
    });

    it("outer query joins transaction details", async () => {
      await service.findByAddress("address");
      expect(outerQueryBuilderMock.leftJoin).toHaveBeenCalledWith(
        "transaction.transactionReceipt",
        "transactionReceipt"
      );
      expect(outerQueryBuilderMock.addSelect).toBeCalledWith([
        "transactionReceipt.gasUsed",
        "transactionReceipt.cumulativeGasUsed",
        "transactionReceipt.contractAddress",
      ]);
      expect(outerQueryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.block", "block");
      expect(outerQueryBuilderMock.addSelect).toHaveBeenCalledWith(["block.status"]);
    });

    it("outer query orders by receivedAt and transactionIndex", async () => {
      await service.findByAddress("address", { sort: SortingOrder.Asc });
      expect(outerQueryBuilderMock.orderBy).toHaveBeenCalledWith("transaction.receivedAt", "ASC");
      expect(outerQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("transaction.transactionIndex", "ASC");
    });

    it("returns list of transactions", async () => {
      const result = await service.findByAddress("address");
      expect(outerQueryBuilderMock.getMany).toBeCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe("getAccountNonce", () => {
    let queryBuilderMock;
    let blockQueryBuilderMock;
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

      it("orders by block number then by nonce", async () => {
        await service.getAccountNonce({ accountAddress: address });
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transaction.blockNumber", "DESC");
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
        blockQueryBuilderMock = mock<typeorm.SelectQueryBuilder<Block>>();

        (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
        (blockRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(blockQueryBuilderMock);
        (queryBuilderMock.getRawOne as jest.Mock).mockResolvedValue(transaction);
        (blockQueryBuilderMock.getQuery as jest.Mock).mockReturnValue("executed block query");
      });

      it("creates query builders with proper params", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("transaction");
        expect(blockRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(blockRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("block");
      });

      it("selects transaction nonce", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(queryBuilderMock.select).toHaveBeenCalledWith("nonce");
      });

      it("filters transactions by the specified address and isL1Originated", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(queryBuilderMock.where).toHaveBeenCalledWith({ from: address, isL1Originated: false });
      });

      it("filters transactions by block number <= last executed block", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(blockQueryBuilderMock.select).toHaveBeenCalledWith("number");
        expect(blockQueryBuilderMock.where).toHaveBeenCalledWith("block.status = :status");
        expect(blockQueryBuilderMock.orderBy).toHaveBeenCalledWith("block.status", "DESC");
        expect(blockQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("block.number", "DESC");
        expect(blockQueryBuilderMock.limit).toHaveBeenCalledWith(1);
        expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("transaction.blockNumber <= (executed block query)");
      });

      it("orders by block number then by nonce", async () => {
        await service.getAccountNonce({ accountAddress: address, isVerified: true });
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transaction.blockNumber", "DESC");
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

  describe("isTransactionVisibleByUser", () => {
    const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const user = { address: userAddress, token: "token" };
    const txHash = "0xabcdef1234567890";

    describe("when user is the sender", () => {
      it("returns true", async () => {
        const transaction = {
          hash: txHash,
          from: userAddress,
          to: "0x0987654321098765432109876543210987654321",
        } as Transaction;
        const result = await service.isTransactionVisibleByUser(transaction, user);
        expect(result).toBe(true);
      });
    });

    describe("when user is the receiver", () => {
      it("returns true", async () => {
        const transaction = {
          hash: txHash,
          from: "0x1234567890123456789012345678901234567890",
          to: userAddress,
        } as Transaction;
        const result = await service.isTransactionVisibleByUser(transaction, user);
        expect(result).toBe(true);
      });
    });

    describe("when user has a visible transaction record", () => {
      let transaction: Transaction;

      beforeEach(() => {
        transaction = {
          hash: txHash,
          from: "0x1234567890123456789012345678901234567890",
          to: "0x0987654321098765432109876543210987654321",
        } as Transaction;
      });

      it("returns true when a visible transaction record exists", async () => {
        (visibleTransactionRepositoryMock.findOne as jest.Mock).mockResolvedValue({ transactionHash: txHash });
        const result = await service.isTransactionVisibleByUser(transaction, user);
        expect(result).toBe(true);
        expect(visibleTransactionRepositoryMock.findOne).toHaveBeenCalledWith({
          where: { transactionHash: txHash, visibleBy: userAddress },
          select: { transactionHash: true },
        });
      });

      it("returns false when no visible transaction record exists", async () => {
        (visibleTransactionRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);
        const result = await service.isTransactionVisibleByUser(transaction, user);
        expect(result).toBe(false);
      });

      describe("when disableTxVisibilityByTopics is true", () => {
        beforeEach(() => {
          (configServiceMock.get as jest.Mock).mockReturnValue(true);
        });

        it("returns false without querying visible transactions", async () => {
          const result = await service.isTransactionVisibleByUser(transaction, user);
          expect(result).toBe(false);
          expect(visibleTransactionRepositoryMock.findOne).not.toHaveBeenCalled();
        });
      });
    });

    describe("when user is not related to the transaction", () => {
      let transaction: Transaction;

      beforeEach(() => {
        transaction = {
          hash: txHash,
          from: "0x1234567890123456789012345678901234567890",
          to: "0x0987654321098765432109876543210987654321",
        } as Transaction;
      });

      it("returns false when no visible transaction record exists", async () => {
        (visibleTransactionRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);
        const result = await service.isTransactionVisibleByUser(transaction, user);
        expect(result).toBe(false);
      });
    });
  });
});
