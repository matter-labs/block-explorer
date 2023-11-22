import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Pagination, IPaginationMeta } from "nestjs-typeorm-paginate";
import * as utils from "../common/utils";
import { LogService, FilterLogsOptions, FilterLogsByAddressOptions } from "./log.service";
import { Log } from "./log.entity";

jest.mock("../common/utils");

describe("LogService", () => {
  let service: LogService;
  let repositoryMock: Repository<Log>;

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
});
