import { Test, TestingModule } from "@nestjs/testing";
import { mock, MockProxy } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Pagination, IPaginationMeta } from "nestjs-typeorm-paginate";
import * as utils from "../common/utils";
import { ConfigService } from "@nestjs/config";
import { LogService, FilterLogsOptions } from "./log.service";
import { Log } from "./log.entity";
import { VisibleLog } from "./visibleLog.entity";
import { IndexerStateService } from "../indexerState/indexerState.service";

jest.mock("../common/utils", () => ({
  ...jest.requireActual("../common/utils"),
  paginate: jest.fn(),
}));

describe("LogService", () => {
  let service: LogService;
  let repositoryMock: MockProxy<Repository<Log>>;
  let visibleLogRepositoryMock: MockProxy<Repository<VisibleLog>>;
  let configServiceMock: ConfigService;

  const pagingOptions = {
    limit: 10,
    page: 2,
  };

  beforeEach(async () => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(false),
    });
    repositoryMock = mock<Repository<Log>>();
    visibleLogRepositoryMock = mock<Repository<VisibleLog>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogService,
        {
          provide: getRepositoryToken(Log),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(VisibleLog),
          useValue: visibleLogRepositoryMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: IndexerStateService,
          useValue: { getLastReadyBlockNumber: jest.fn().mockResolvedValue(1_000_000) },
        },
      ],
    }).compile();

    service = module.get<LogService>(LogService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("findAll", () => {
    let queryBuilderMock;
    let filterOptions: FilterLogsOptions;

    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<Log>>();
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
    });

    it("creates query builder with proper params", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("log");
    });

    describe("when filter options are not specified", () => {
      beforeEach(() => {
        filterOptions = undefined;
      });

      it("filters logs using default findOptions", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(queryBuilderMock.where).toBeCalledTimes(1);
        expect(queryBuilderMock.where).toHaveBeenCalledWith({});
      });
    });

    describe("when filter options are specified", () => {
      beforeEach(() => {
        filterOptions = {
          address: "address",
          transactionHash: "transactionHash",
        };
      });

      it("filters logs using specified findOptions", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(queryBuilderMock.where).toBeCalledTimes(1);
        expect(queryBuilderMock.where).toHaveBeenCalledWith({
          address: "address",
          transactionHash: "transactionHash",
        });
      });
    });

    it("returns logs ordered by blockNumber ASC and logIndex ASC when transactionHash is specified", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("log.blockNumber", "ASC");
      expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
      expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("log.logIndex", "ASC");
    });

    it("returns paginated result", async () => {
      const paginationResult = mock<Pagination<Log, IPaginationMeta>>();
      (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      const result = await service.findAll(filterOptions, pagingOptions);
      expect(utils.paginate).toBeCalledTimes(1);
      expect(utils.paginate).toBeCalledWith({
        queryBuilder: queryBuilderMock,
        options: pagingOptions,
      });
      expect(result).toBe(paginationResult);
    });

    describe("when visibleBy is defined and disableTxVisibilityByTopics is false", () => {
      const address1 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const address2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      let visibleLogQbMock;

      beforeEach(() => {
        visibleLogQbMock = mock<SelectQueryBuilder<VisibleLog>>();
        (visibleLogRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(visibleLogQbMock);
        (utils.paginate as jest.Mock).mockResolvedValue({ items: [] });
      });

      it("creates query builder on visibleLogRepository", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(visibleLogRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("vl");
      });

      it("selects logNumber from visible log", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(visibleLogQbMock.select).toHaveBeenCalledWith("vl.logNumber", "logNumber");
      });

      it("filters with visibleBy and address", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(visibleLogQbMock.where).toHaveBeenCalledWith({
          visibleBy: address2,
          address: address1,
        });
      });

      it("orders by vl.blockNumber DESC and vl.logIndex DESC", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(visibleLogQbMock.orderBy).toHaveBeenCalledWith("vl.blockNumber", "DESC");
        expect(visibleLogQbMock.addOrderBy).toHaveBeenCalledWith("vl.logIndex", "DESC");
      });

      it("calls paginate with wrapQuery", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(utils.paginate).toHaveBeenCalledWith({
          queryBuilder: visibleLogQbMock,
          options: pagingOptions,
          wrapQuery: expect.any(Function),
        });
      });

      it("wrapQuery builds outer query with inner join on log number", async () => {
        let outerLogQbMock;
        (utils.paginate as jest.Mock).mockImplementation(async ({ wrapQuery }) => {
          const pagedInnerQbMock = mock<SelectQueryBuilder<VisibleLog>>({
            getQuery: jest.fn().mockReturnValue("inner SQL"),
            getParameters: jest.fn().mockReturnValue({ param1: "value1" }),
          });
          Object.defineProperty(pagedInnerQbMock, "expressionMap", {
            value: { orderBys: { "vl.blockNumber": "DESC" } },
          });

          outerLogQbMock = mock<SelectQueryBuilder<Log>>();
          (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(outerLogQbMock);

          await wrapQuery(pagedInnerQbMock);
          return { items: [] };
        });

        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);

        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("log");
        expect(outerLogQbMock.innerJoin).toHaveBeenCalledWith(
          "(inner SQL)",
          "_paginated",
          `"_paginated"."logNumber" = "log"."number"`
        );
        expect(outerLogQbMock.setParameters).toHaveBeenCalledWith({ param1: "value1" });
        expect(outerLogQbMock.addOrderBy).toHaveBeenCalledWith("log.blockNumber", "DESC");
      });

      it("returns paginated result", async () => {
        const paginationResult = mock<Pagination<Log, IPaginationMeta>>();
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        const result = await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(result).toBe(paginationResult);
      });
    });

    describe("when visibleBy is defined and disableTxVisibilityByTopics is true", () => {
      const visibleBy = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

      beforeEach(() => {
        (configServiceMock.get as jest.Mock).mockReturnValue(true);
      });

      it("uses logRepository", async () => {
        await service.findAll({ visibleBy }, pagingOptions);
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("log");
      });

      it("filters by transactionFrom in where", async () => {
        await service.findAll({ visibleBy }, pagingOptions);
        expect(queryBuilderMock.where).toHaveBeenCalledWith({ transactionFrom: visibleBy });
      });
    });
  });

  describe("findMany", () => {
    const someAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    let innerQueryBuilderMock;
    let outerQueryBuilderMock;

    beforeEach(() => {
      innerQueryBuilderMock = mock<SelectQueryBuilder<Log>>({
        getQuery: jest.fn().mockReturnValue("inner query"),
        getParameters: jest.fn().mockReturnValue({}),
      });
      outerQueryBuilderMock = mock<SelectQueryBuilder<Log>>({
        getMany: jest.fn().mockResolvedValue([]),
      });
      (repositoryMock.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce(innerQueryBuilderMock)
        .mockReturnValueOnce(outerQueryBuilderMock);
    });

    it("creates two query builders for inner and outer queries", async () => {
      await service.findMany({ topics: {} });
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("log");
    });

    it("defaults topics to empty object when not provided", async () => {
      await service.findMany({});
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(innerQueryBuilderMock.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining("log.topics"),
        expect.anything()
      );
    });

    it("inner query filters by address when address is defined", async () => {
      await service.findMany({ address: someAddress, topics: {} });
      expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith({ address: someAddress });
    });

    it("inner query does not filter by address when address is not defined", async () => {
      await service.findMany({ topics: {} });
      expect(innerQueryBuilderMock.andWhere).not.toHaveBeenCalledWith({ address: expect.anything() });
    });

    it("inner query filters by fromBlock", async () => {
      await service.findMany({ fromBlock: 10, topics: {} });
      expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith({ blockNumber: MoreThanOrEqual(10) });
    });

    it("inner query filters by toBlock", async () => {
      await service.findMany({ toBlock: 10, topics: {} });
      expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith({ blockNumber: LessThanOrEqual(10) });
    });

    it("applies only watermark filter when no block conditions are sent", async () => {
      await service.findMany({ topics: {} });
      expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledTimes(1);
      expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith({
        blockNumber: LessThanOrEqual(1_000_000),
      });
    });

    function hexToBuf(hex: string): Buffer {
      return Buffer.from(hex.replace("0x", ""), "hex");
    }

    it("inner query filters by first topic when topic0 is defined", async () => {
      const topic = "0xabab";
      await service.findMany({ topics: { topic0: topic } });
      expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith("log.topics[1] = :topic0", {
        topic0: hexToBuf(topic),
      });
    });

    it("inner query filters by second topic when topic1 is defined", async () => {
      const topic = "0xabab";
      await service.findMany({ topics: { topic1: topic } });
      expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith("log.topics[2] = :topic1", {
        topic1: hexToBuf(topic),
      });
    });

    it("inner query filters by third topic when topic2 is defined", async () => {
      const topic = "0xabab";
      await service.findMany({ topics: { topic2: topic } });
      expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith("log.topics[3] = :topic2", {
        topic2: hexToBuf(topic),
      });
    });

    it("inner query filters by fourth topic when topic3 is defined", async () => {
      const topic = "0xabab";
      await service.findMany({ topics: { topic3: topic } });
      expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith("log.topics[4] = :topic3", {
        topic3: hexToBuf(topic),
      });
    });

    it("inner query sets offset and limit", async () => {
      await service.findMany({ topics: {}, page: 3, offset: 20 });
      expect(innerQueryBuilderMock.offset).toHaveBeenCalledWith(40);
      expect(innerQueryBuilderMock.limit).toHaveBeenCalledWith(20);
    });

    it("outer query joins transaction and receipt", async () => {
      await service.findMany({ topics: {} });
      expect(outerQueryBuilderMock.leftJoin).toHaveBeenCalledWith("log.transaction", "transaction");
      expect(outerQueryBuilderMock.leftJoin).toHaveBeenCalledWith(
        "transaction.transactionReceipt",
        "transactionReceipt"
      );
      expect(outerQueryBuilderMock.addSelect).toHaveBeenCalledWith([
        "transaction.gasPrice",
        "transactionReceipt.gasUsed",
      ]);
    });

    it("applies order to both inner and outer queries", async () => {
      await service.findMany({ order: "ASC", topics: {} });
      expect(innerQueryBuilderMock.orderBy).toHaveBeenCalledWith("log.blockNumber", "ASC");
      expect(innerQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("log.logIndex", "ASC");
      expect(outerQueryBuilderMock.orderBy).toHaveBeenCalledWith("log.blockNumber", "ASC");
      expect(outerQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("log.logIndex", "ASC");
    });

    it("executes outer query and returns results", async () => {
      const result = await service.findMany({ topics: {} });
      expect(outerQueryBuilderMock.getMany).toBeCalledTimes(1);
      expect(result).toEqual([]);
    });
  });
});
