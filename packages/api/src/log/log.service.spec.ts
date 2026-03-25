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

jest.mock("../common/utils");

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

    describe("when visibleBy is defined and disableTxVisibilityByTopics is false", () => {
      let visibleLogQueryBuilderMock;
      const address1 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const address2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

      beforeEach(() => {
        visibleLogQueryBuilderMock = mock<SelectQueryBuilder<VisibleLog>>();
        (visibleLogRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(visibleLogQueryBuilderMock);
        (utils.paginate as jest.Mock).mockResolvedValue({ items: [] });
      });

      it("uses visibleLogRepository instead of logRepository", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(visibleLogRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("visibleLog");
        expect(repositoryMock.createQueryBuilder).not.toHaveBeenCalled();
      });

      it("selects visibleLog number", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(visibleLogQueryBuilderMock.select).toHaveBeenCalledWith("visibleLog.number");
      });

      it("joins log records", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(visibleLogQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith("visibleLog.log", "log");
      });

      it("filters by visibleBy and address", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(visibleLogQueryBuilderMock.where).toHaveBeenCalledWith({
          visibleBy: address2,
          address: address1,
        });
      });

      it("orders by visibleLog.timestamp DESC and visibleLog.logIndex ASC", async () => {
        await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(visibleLogQueryBuilderMock.orderBy).toHaveBeenCalledWith("visibleLog.timestamp", "DESC");
        expect(visibleLogQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("visibleLog.logIndex", "ASC");
      });

      it("returns unwrapped log items", async () => {
        const log = mock<Log>();
        const paginationResult = mock<Pagination<VisibleLog, IPaginationMeta>>({
          items: [{ log } as unknown as VisibleLog],
        });
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        const result = await service.findAll({ address: address1, visibleBy: address2 }, pagingOptions);
        expect(result.items).toEqual([log]);
      });
    });

    describe("when visibleBy is defined and disableTxVisibilityByTopics is true", () => {
      const visibleBy = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

      beforeEach(() => {
        (configServiceMock.get as jest.Mock).mockReturnValue(true);
      });

      it("uses logRepository (not visibleLogRepository)", async () => {
        await service.findAll({ visibleBy }, pagingOptions);
        expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("log");
        expect(visibleLogRepositoryMock.createQueryBuilder).not.toHaveBeenCalled();
      });

      it("filters by transactionFrom instead of topic-based visibility", async () => {
        await service.findAll({ visibleBy }, pagingOptions);
        expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({ transactionFrom: visibleBy });
      });
    });
  });

  describe("findMany", () => {
    const someAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    let queryBuilderMock;

    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<Log>>();
      repositoryMock.createQueryBuilder.mockReturnValue(queryBuilderMock);
    });

    it("filters by address when address is defined", async () => {
      await service.findMany({
        address: someAddress,
        topics: {},
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({ address: someAddress });
    });

    it("does not filter by address when address is not defined", async () => {
      await service.findMany({
        topics: {},
      });
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith({ address: expect.anything() });
    });

    it("filters by fromBlock when address is defined", async () => {
      await service.findMany({
        fromBlock: 10,
        topics: {},
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({ blockNumber: MoreThanOrEqual(10) });
    });

    it("filters by toBlock when address is defined", async () => {
      await service.findMany({
        toBlock: 10,
        topics: {},
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({ blockNumber: LessThanOrEqual(10) });
    });

    it("does not restrict by block when no block conditions are sent", async () => {
      await service.findMany({
        topics: {},
      });
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith({ blockNumber: expect.anything() });
    });

    function hexToBuf(hex: string): Buffer {
      return Buffer.from(hex.replace("0x", ""), "hex");
    }

    it("filters by first topic when topic0 is defined", async () => {
      const topic = "0xabab";
      await service.findMany({
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
      await service.findMany({
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
      await service.findMany({
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
      await service.findMany({
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

    it("applies order when provided", async () => {
      await service.findMany({
        order: "ASC",
        topics: {},
      });
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("log.blockNumber", "ASC");
      expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("log.logIndex", "ASC");
    });
  });
});
