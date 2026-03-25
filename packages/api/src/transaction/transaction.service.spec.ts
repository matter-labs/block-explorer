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
import { Log } from "../log/log.entity";
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
    let addressTransactionsQueryBuilderMock;
    let visibleTransactionsQueryBuilderMock;
    let addressVisibleTransactionsQueryBuilderMock;
    let filterTransactionsOptions: FilterTransactionsOptions;
    const pagingOptions = {
      filterOptions: {},
      limit: 10,
      page: 2,
    };

    beforeEach(() => {
      queryBuilderMock = mock<typeorm.SelectQueryBuilder<Transaction>>();
      addressTransactionsQueryBuilderMock = mock<typeorm.SelectQueryBuilder<AddressTransaction>>();
      visibleTransactionsQueryBuilderMock = mock<typeorm.SelectQueryBuilder<VisibleTransaction>>();
      addressVisibleTransactionsQueryBuilderMock = mock<typeorm.SelectQueryBuilder<AddressVisibleTransaction>>();

      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
      (addressTransactionRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(
        addressTransactionsQueryBuilderMock
      );
      (visibleTransactionRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(
        visibleTransactionsQueryBuilderMock
      );
      (addressVisibleTransactionRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(
        addressVisibleTransactionsQueryBuilderMock
      );
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
        expect(repositoryMock.createQueryBuilder).toHaveBeenNthCalledWith(1, "transaction");
      });

      it("filters transactions by the specified options", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.where).toHaveBeenCalledWith({
          blockNumber: filterTransactionsOptions.blockNumber,
          receivedAt: filterTransactionsOptions.receivedAt,
        });
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

      it("joins block record to get block specific fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.block", "block");
      });

      it("selects only needed block fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith(["block.status"]);
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

    describe("when address filter option is specified without visibleBy", () => {
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
          address: "address",
        };
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      });

      it("creates query builder with proper params", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("addressTransaction");
      });

      it("selects address transactions number", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.select).toBeCalledTimes(1);
        expect(addressTransactionsQueryBuilderMock.select).toHaveBeenCalledWith("addressTransaction.number");
      });

      it("joins transaction records", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
        expect(addressTransactionsQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
          "addressTransaction.transaction",
          "transaction"
        );
      });

      it("joins transactionReceipt record to get receipt specific fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.leftJoin).toHaveBeenCalledWith(
          "transaction.transactionReceipt",
          "transactionReceipt"
        );
      });

      it("selects only needed transactionReceipt fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transactionReceipt.gasUsed",
          "transactionReceipt.contractAddress",
        ]);
      });

      it("joins block records", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
        expect(addressTransactionsQueryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.block", "block");
      });

      it("filters transactions by the specified options when only address is defined", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.where).toHaveBeenCalledWith({ address: "address" });
      });

      it("filters transactions by the specified options when additional filters are defined", async () => {
        const filterOptions = {
          address: "address",
          blockNumber: 100,
          receivedAt: new typeorm.FindOperator("lessThanOrEqual", new Date()),
        };
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.where).toHaveBeenCalledWith({
          address: filterOptions.address,
          receivedAt: filterOptions.receivedAt,
          blockNumber: filterOptions.blockNumber,
        });
      });

      it("selects only needed block fields", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.addSelect).toHaveBeenCalledWith(["block.status"]);
      });

      it("orders transactions by blockNumber, receivedAt and transactionIndex DESC", async () => {
        await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(addressTransactionsQueryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(addressTransactionsQueryBuilderMock.orderBy).toHaveBeenCalledWith(
          "addressTransaction.blockNumber",
          "DESC"
        );
        expect(addressTransactionsQueryBuilderMock.addOrderBy).toBeCalledTimes(2);
        expect(addressTransactionsQueryBuilderMock.addOrderBy).toHaveBeenCalledWith(
          "addressTransaction.receivedAt",
          "DESC"
        );
        expect(addressTransactionsQueryBuilderMock.addOrderBy).toHaveBeenCalledWith(
          "addressTransaction.transactionIndex",
          "DESC"
        );
      });

      it("returns paginated result", async () => {
        const result = await service.findAll(filterTransactionsOptions, pagingOptions);
        expect(utils.paginate).toBeCalledTimes(1);
        expect(utils.paginate).toBeCalledWith(addressTransactionsQueryBuilderMock, pagingOptions);
        expect(result).toEqual({ ...paginationResult, items: paginationResult.items.map((i) => i.transaction) });
      });
    });

    describe("when visibleBy is set without address", () => {
      const visibleBy = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

      describe("when disableTxVisibilityByTopics is false", () => {
        const paginationResult = mock<Pagination<VisibleTransaction, IPaginationMeta>>({
          items: [{ transaction: mock<Transaction>() }, { transaction: mock<Transaction>() }],
        });

        beforeEach(() => {
          filterTransactionsOptions = { visibleBy };
          (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        });

        it("uses visibleTransactionRepository", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(visibleTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("visibleTransaction");
        });

        it("selects visibleTransaction number", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(visibleTransactionsQueryBuilderMock.select).toHaveBeenCalledWith("visibleTransaction.number");
        });

        it("joins transaction records", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(visibleTransactionsQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
            "visibleTransaction.transaction",
            "transaction"
          );
        });

        it("filters by visibleBy", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(visibleTransactionsQueryBuilderMock.where).toHaveBeenCalledWith({ visibleBy });
        });

        it("orders by visibleTransaction.blockNumber DESC", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(visibleTransactionsQueryBuilderMock.orderBy).toHaveBeenCalledWith(
            "visibleTransaction.blockNumber",
            "DESC"
          );
        });

        it("returns unwrapped paginated result", async () => {
          const result = await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(result).toEqual({ ...paginationResult, items: paginationResult.items.map((i) => i.transaction) });
        });
      });

      describe("when disableTxVisibilityByTopics is true", () => {
        const paginationResult = mock<Pagination<AddressTransaction, IPaginationMeta>>({
          items: [{ transaction: mock<Transaction>() }],
        });

        beforeEach(() => {
          (configServiceMock.get as jest.Mock).mockReturnValue(true);
          filterTransactionsOptions = { visibleBy };
          (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        });

        it("falls back to addressTransactionRepository (own transactions only)", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("addressTransaction");
        });

        it("filters by visibleBy as address", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressTransactionsQueryBuilderMock.where).toHaveBeenCalledWith({ address: visibleBy });
        });
      });
    });

    describe("when visibleBy and address are both set and differ", () => {
      const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const visibleBy = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

      describe("when disableTxVisibilityByTopics is false", () => {
        const paginationResult = mock<Pagination<AddressVisibleTransaction, IPaginationMeta>>({
          items: [{ transaction: mock<Transaction>() }, { transaction: mock<Transaction>() }],
        });

        beforeEach(() => {
          filterTransactionsOptions = { address, visibleBy };
          (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        });

        it("uses addressVisibleTransactionRepository", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressVisibleTransactionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith(
            "addressVisibleTransaction"
          );
        });

        it("selects addressVisibleTransaction number", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressVisibleTransactionsQueryBuilderMock.select).toHaveBeenCalledWith(
            "addressVisibleTransaction.number"
          );
        });

        it("joins transaction records", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressVisibleTransactionsQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
            "addressVisibleTransaction.transaction",
            "transaction"
          );
        });

        it("filters by address and visibleBy", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressVisibleTransactionsQueryBuilderMock.where).toHaveBeenCalledWith({ address, visibleBy });
        });

        it("orders by addressVisibleTransaction.blockNumber DESC", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(addressVisibleTransactionsQueryBuilderMock.orderBy).toHaveBeenCalledWith(
            "addressVisibleTransaction.blockNumber",
            "DESC"
          );
        });

        it("returns unwrapped paginated result", async () => {
          const result = await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(result).toEqual({ ...paginationResult, items: paginationResult.items.map((i) => i.transaction) });
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
          // address > visibleBy lexicographically, so fromToMin=visibleBy, fromToMax=address
          expect(queryBuilderMock.where).toHaveBeenCalledWith(
            expect.objectContaining({
              fromToMin: visibleBy,
              fromToMax: address,
            })
          );
        });

        it("orders by transaction.blockNumber DESC", async () => {
          await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transaction.blockNumber", "DESC");
        });

        it("returns paginated result", async () => {
          const result = await service.findAll(filterTransactionsOptions, pagingOptions);
          expect(result).toBe(paginationResult);
        });
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

    it("joins block records", async () => {
      await service.findByAddress("address");
      expect(addressTransactionsQueryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
      expect(addressTransactionsQueryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.block", "block");
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

    it("selects only needed block fields", async () => {
      await service.findByAddress("address");
      expect(addressTransactionsQueryBuilderMock.addSelect).toHaveBeenCalledWith(["block.status"]);
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

    describe("when user is the sender", () => {
      it("returns true", () => {
        const transaction = {
          from: userAddress,
          to: "0x0987654321098765432109876543210987654321",
        } as Transaction;
        const result = service.isTransactionVisibleByUser(transaction, [], user);
        expect(result).toBe(true);
      });
    });

    describe("when user is the receiver", () => {
      it("returns true", () => {
        const transaction = {
          from: "0x1234567890123456789012345678901234567890",
          to: userAddress,
        } as Transaction;
        const result = service.isTransactionVisibleByUser(transaction, [], user);
        expect(result).toBe(true);
      });
    });

    describe("when user address is in log topics", () => {
      const paddedAddress = "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266";
      let transaction: Transaction;

      beforeEach(() => {
        transaction = {
          from: "0x1234567890123456789012345678901234567890",
          to: "0x0987654321098765432109876543210987654321",
        } as Transaction;
      });

      it("returns true when user address is in topic[1]", () => {
        const logs = [
          {
            topics: ["0xtopic0", paddedAddress, "0xtopic2"],
          } as Log,
        ];
        const result = service.isTransactionVisibleByUser(transaction, logs, user);
        expect(result).toBe(true);
      });

      it("returns true when user address is in topic[2]", () => {
        const logs = [
          {
            topics: ["0xtopic0", "0xtopic1", paddedAddress],
          } as Log,
        ];
        const result = service.isTransactionVisibleByUser(transaction, logs, user);
        expect(result).toBe(true);
      });

      it("returns true when user address is in topic[3]", () => {
        const logs = [
          {
            topics: ["0xtopic0", "0xtopic1", "0xtopic2", paddedAddress],
          } as Log,
        ];
        const result = service.isTransactionVisibleByUser(transaction, logs, user);
        expect(result).toBe(true);
      });

      it("returns true with case-insensitive address matching", () => {
        const logs = [
          {
            topics: ["0xtopic0", paddedAddress.toUpperCase()],
          } as Log,
        ];
        const result = service.isTransactionVisibleByUser(transaction, logs, user);
        expect(result).toBe(true);
      });

      it("returns true when user address is in multiple logs", () => {
        const logs = [
          {
            topics: ["0xtopic0", "0xtopic1"],
          } as Log,
          {
            topics: ["0xtopic0", paddedAddress],
          } as Log,
        ];
        const result = service.isTransactionVisibleByUser(transaction, logs, user);
        expect(result).toBe(true);
      });

      describe("when disableTxVisibilityByTopics is true", () => {
        beforeEach(() => {
          (configServiceMock.get as jest.Mock).mockReturnValue(true);
        });

        it("returns false even when user address is in log topics", () => {
          const logs = [{ topics: ["0xtopic0", paddedAddress] } as Log];
          const result = service.isTransactionVisibleByUser(transaction, logs, user);
          expect(result).toBe(false);
        });
      });
    });

    describe("when user is not related to the transaction", () => {
      let transaction: Transaction;

      beforeEach(() => {
        transaction = {
          from: "0x1234567890123456789012345678901234567890",
          to: "0x0987654321098765432109876543210987654321",
        } as Transaction;
      });

      it("returns false when user is not sender, receiver, or in logs", () => {
        const logs = [
          {
            topics: ["0xtopic0", "0xothertopic1", "0xothertopic2"],
          } as Log,
        ];
        const result = service.isTransactionVisibleByUser(transaction, logs, user);
        expect(result).toBe(false);
      });

      it("returns false when there are no logs", () => {
        const result = service.isTransactionVisibleByUser(transaction, [], user);
        expect(result).toBe(false);
      });
    });
  });
});
