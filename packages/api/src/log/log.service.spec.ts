import { Test, TestingModule } from "@nestjs/testing";
import { mock, MockProxy } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  Repository,
  SelectQueryBuilder,
  MoreThanOrEqual,
  LessThanOrEqual,
  Brackets,
  WhereExpressionBuilder,
} from "typeorm";
import { Pagination, IPaginationMeta } from "nestjs-typeorm-paginate";
import * as utils from "../common/utils";
import { LogService, FilterLogsOptions, FilterLogsByAddressOptions } from "./log.service";
import { Log } from "./log.entity";

jest.mock("../common/utils");

describe("LogService", () => {
  let service: LogService;
  let repositoryMock: MockProxy<Repository<Log>>;

  const pagingOptions = {
    limit: 10,
    page: 2,
  };

  beforeEach(async () => {
    repositoryMock = mock<Repository<Log>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogService,
        {
          provide: getRepositoryToken(Log),
          useValue: repositoryMock,
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

    it("returns logs ordered by timestamp DESC and logIndex ASC", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("log.timestamp", "DESC");
      expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
      expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("log.logIndex", "ASC");
    });

    it("returns paginated result", async () => {
      const paginationResult = mock<Pagination<Log, IPaginationMeta>>();
      (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      const result = await service.findAll(filterOptions, pagingOptions);
      expect(utils.paginate).toBeCalledTimes(1);
      expect(utils.paginate).toBeCalledWith(queryBuilderMock, pagingOptions);
      expect(result).toBe(paginationResult);
    });

    it("does special query when visibleBy is defined", async () => {
      const address1 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const address2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const filterOptions = { address: address1, visibleBy: address2 };
      await service.findAll(filterOptions, pagingOptions);
      expect(queryBuilderMock.innerJoin).toBeCalledWith("log.transaction", "transactions");
      expect(queryBuilderMock.andWhere).toBeCalledWith(expect.any(Brackets));
      const brackets = queryBuilderMock.andWhere.mock.calls[0][0] as Brackets;
      expect(brackets).toBeInstanceOf(Brackets);
      const qb = mock<WhereExpressionBuilder>();
      brackets.whereFactory(qb);
      expect(qb.where).toHaveBeenCalledWith(`log.topics[1] = :visibleByTopic`);
      expect(qb.orWhere).toHaveBeenCalledWith("log.topics[2] = :visibleByTopic");
      expect(qb.orWhere).toHaveBeenCalledWith("log.topics[3] = :visibleByTopic");
      expect(qb.orWhere).toHaveBeenCalledWith("transactions.from = :visibleBy");
    });
  });

  describe("findMany", () => {
    let queryBuilderMock;
    let filterOptions: FilterLogsByAddressOptions;

    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<Log>>();
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);

      filterOptions = {
        address: "address",
      };
    });

    describe("when address filter options is specified", () => {
      beforeEach(() => {
        jest.spyOn(queryBuilderMock, "getMany").mockResolvedValue([
          {
            logIndex: 1,
          },
          {
            logIndex: 2,
          },
        ]);
      });

      it("creates query builder with proper params", async () => {
        await service.findMany(filterOptions);
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("log");
      });

      it("joins transaction and transactionReceipt records to the logs", async () => {
        await service.findMany(filterOptions);
        expect(queryBuilderMock.leftJoin).toBeCalledTimes(2);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("log.transaction", "transaction");
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.transactionReceipt", "transactionReceipt");
      });

      it("selects only needed fields from joined records", async () => {
        await service.findMany(filterOptions);
        expect(queryBuilderMock.addSelect).toBeCalledTimes(1);
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith(["transaction.gasPrice", "transactionReceipt.gasUsed"]);
      });

      it("filters logs by address", async () => {
        await service.findMany(filterOptions);
        expect(queryBuilderMock.where).toBeCalledTimes(1);
        expect(queryBuilderMock.where).toHaveBeenCalledWith({
          address: filterOptions.address,
        });
      });

      describe("when fromBlock filter is specified", () => {
        it("adds blockNumber filter", async () => {
          await service.findMany({
            ...filterOptions,
            fromBlock: 10,
          });
          expect(queryBuilderMock.andWhere).toBeCalledTimes(1);
          expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({
            blockNumber: MoreThanOrEqual(10),
          });
        });
      });

      describe("when toBlock filter is specified", () => {
        it("adds toBlock filter", async () => {
          await service.findMany({
            ...filterOptions,
            toBlock: 10,
          });
          expect(queryBuilderMock.andWhere).toBeCalledTimes(1);
          expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({
            blockNumber: LessThanOrEqual(10),
          });
        });
      });

      it("sets offset and limit", async () => {
        await service.findMany({
          ...filterOptions,
          page: 2,
          offset: 100,
        });
        expect(queryBuilderMock.offset).toBeCalledTimes(1);
        expect(queryBuilderMock.offset).toHaveBeenCalledWith(100);
        expect(queryBuilderMock.limit).toBeCalledTimes(1);
        expect(queryBuilderMock.limit).toHaveBeenCalledWith(100);
      });

      it("sorts by blockNumber asc and logIndex asc", async () => {
        await service.findMany(filterOptions);
        expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("log.blockNumber", "ASC");
        expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("log.logIndex", "ASC");
      });

      it("executes query and returns transfers list", async () => {
        const result = await service.findMany(filterOptions);
        expect(result).toEqual([
          {
            logIndex: 1,
          },
          {
            logIndex: 2,
          },
        ]);
        expect(queryBuilderMock.getMany).toBeCalledTimes(1);
      });
    });
  });

  describe("findManyByTopics", () => {
    const someAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    let queryBuilderMock;

    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<Log>>();
      repositoryMock.createQueryBuilder.mockReturnValue(queryBuilderMock);
    });

    it("filters by address when address is defined", async () => {
      await service.findManyByTopics({
        address: someAddress,
        topics: {},
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({ address: someAddress });
    });

    it("does not filter by address when address is not defined", async () => {
      await service.findManyByTopics({
        topics: {},
      });
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith({ address: expect.anything() });
    });

    it("filters by fromBlock when address is defined", async () => {
      await service.findManyByTopics({
        fromBlock: 10,
        topics: {},
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({ blockNumber: MoreThanOrEqual(10) });
    });

    it("filters by toBlock when address is defined", async () => {
      await service.findManyByTopics({
        toBlock: 10,
        topics: {},
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({ blockNumber: LessThanOrEqual(10) });
    });

    it("does not restrict by block when no block conditions are sent", async () => {
      await service.findManyByTopics({
        topics: {},
      });
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith({ blockNumber: expect.anything() });
    });

    function hexToBuf(hex: string): Buffer {
      return Buffer.from(hex.replace("0x", ""), "hex");
    }

    it("filters by first topic when topic0 is defined", async () => {
      const topic = "0xabab";
      await service.findManyByTopics({
        topics: {
          topic0: topic,
        },
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("log.topics[1] = :topic0", {
        topic0: hexToBuf(topic),
      });
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[2\]/, expect.anything());
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[3\]/, expect.anything());
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[4\]/, expect.anything());
    });

    it("filters by second topic when topic1 is defined", async () => {
      const topic = "0xabab";
      await service.findManyByTopics({
        topics: {
          topic1: topic,
        },
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("log.topics[2] = :topic1", {
        topic1: hexToBuf(topic),
      });
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[0\]/, expect.anything());
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[3\]/, expect.anything());
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[4\]/, expect.anything());
    });

    it("filters by third topic when topic2 is defined", async () => {
      const topic = "0xabab";
      await service.findManyByTopics({
        topics: {
          topic2: topic,
        },
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("log.topics[3] = :topic2", {
        topic2: hexToBuf(topic),
      });
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[0\]/, expect.anything());
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[1\]/, expect.anything());
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[4\]/, expect.anything());
    });

    it("filters by fourth topic when topic3 is defined", async () => {
      const topic = "0xabab";
      await service.findManyByTopics({
        topics: {
          topic3: topic,
        },
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("log.topics[4] = :topic3", {
        topic3: hexToBuf(topic),
      });
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[1\]/, expect.anything());
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[2\]/, expect.anything());
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith(/log.topics\[3\]/, expect.anything());
    });
  });
});
