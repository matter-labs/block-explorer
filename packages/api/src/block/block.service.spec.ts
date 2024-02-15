import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, FindOptionsOrder } from "typeorm";
import { Pagination, IPaginationMeta } from "nestjs-typeorm-paginate";
import * as utils from "../common/utils";
import { BlockService, FindManyOptions } from "./block.service";
import { Block } from "./block.entity";
import { BlockDetails } from "./blockDetails.entity";

jest.mock("../common/utils");

describe("BlockService", () => {
  let blockRecord;
  let service: BlockService;
  let repositoryMock: Repository<Block>;
  let blockDetailRepositoryMock: Repository<BlockDetails>;

  beforeEach(async () => {
    repositoryMock = mock<Repository<Block>>();
    blockDetailRepositoryMock = mock<Repository<BlockDetails>>();

    blockRecord = {
      number: 123,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockService,
        {
          provide: getRepositoryToken(Block),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(BlockDetails),
          useValue: blockDetailRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<BlockService>(BlockService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getLastBlockNumber", () => {
    beforeEach(() => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(blockRecord);
    });

    it("queries blocks with proper filter options", async () => {
      await service.getLastBlockNumber();
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: {},
        order: { number: "DESC" },
        select: { number: true },
      });
    });

    it("returns last block number", async () => {
      const result = await service.getLastBlockNumber();
      expect(result).toBe(blockRecord.number);
    });

    describe("if there are no blocks", () => {
      beforeEach(() => {
        (repositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      });

      it("returns zero", async () => {
        const result = await service.getLastBlockNumber();
        expect(result).toBe(0);
      });
    });
  });

  describe("getLastVerifiedBlockNumber", () => {
    let queryBuilderMock;
    const blockNumber = 10;
    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<Block>>({
        getOne: jest.fn().mockResolvedValue({ number: blockNumber }),
      });

      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
    });

    it("creates query builder with correct params", async () => {
      await service.getLastVerifiedBlockNumber();
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("block");
    });

    it("selects only block number", async () => {
      await service.getLastVerifiedBlockNumber();
      expect(queryBuilderMock.select).toHaveBeenCalledWith("block.number");
    });

    it("joins batch record to get batch specific fields", async () => {
      await service.getLastVerifiedBlockNumber();
      expect(queryBuilderMock.innerJoin).toHaveBeenCalledWith("block.batch", "batches");
    });

    it("filters batch record by executedAt", async () => {
      await service.getLastVerifiedBlockNumber();
      expect(queryBuilderMock.where).toHaveBeenCalledWith("batches.executedAt IS NOT NULL");
    });

    it("orders blocks by number DESC", async () => {
      await service.getLastVerifiedBlockNumber();
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("block.number", "DESC");
    });

    it("gets only 1 result", async () => {
      await service.getLastVerifiedBlockNumber();
      expect(queryBuilderMock.limit).toHaveBeenCalledWith(1);
    });

    it("returns last block number", async () => {
      const result = await service.getLastVerifiedBlockNumber();
      expect(result).toBe(blockNumber);
    });

    describe("if there are no verified blocks", () => {
      beforeEach(() => {
        (queryBuilderMock.getOne as jest.Mock).mockResolvedValueOnce(null);
      });

      it("returns zero", async () => {
        const result = await service.getLastVerifiedBlockNumber();
        expect(result).toBe(0);
      });
    });
  });

  describe("findOne", () => {
    beforeEach(() => {
      (blockDetailRepositoryMock.findOne as jest.Mock).mockResolvedValue(blockRecord);
    });

    it("queries DB with correct params", async () => {
      await service.findOne(blockRecord.number);
      expect(blockDetailRepositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(blockDetailRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { number: blockRecord.number },
        relations: { batch: true },
      });
    });

    it("selects only specified fields if they are specified", async () => {
      await service.findOne(blockRecord.number, ["number", "timestamp"]);
      expect(blockDetailRepositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(blockDetailRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { number: blockRecord.number },
        select: ["number", "timestamp"],
        relations: { batch: true },
      });
    });

    it("overrides default relations setting if custom value is specified", async () => {
      await service.findOne(blockRecord.number, ["number", "timestamp"], { batch: false });
      expect(blockDetailRepositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(blockDetailRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { number: blockRecord.number },
        select: ["number", "timestamp"],
        relations: { batch: false },
      });
    });

    it("returns block by number", async () => {
      const result = await service.findOne(blockRecord.number);
      expect(result).toBe(blockRecord);
    });
  });

  describe("findAll", () => {
    const filterOptions = {
      number: 1,
    };
    const pagingOptions = {
      filterOptions: {
        fromDate: undefined,
      },
      limit: 10,
      page: 2,
    };

    let queryBuilderMock: SelectQueryBuilder<Block>;

    beforeEach(() => {
      (utils.paginate as jest.Mock).mockImplementation(async (_, __, getCount) => {
        const count = await getCount();
        return mock<Pagination<Block, IPaginationMeta>>({
          meta: {
            totalItems: count,
          },
        });
      });

      queryBuilderMock = mock<SelectQueryBuilder<Block>>({
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      });

      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(null);
    });

    it("creates query builder with correct params", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("block");
    });

    it("joins batch record to get batch specific fields", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("block.batch", "batches");
    });

    it("selects only needed batch fields", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(queryBuilderMock.addSelect).toHaveBeenCalledWith("batches.executedAt");
    });

    it("applies filters", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(queryBuilderMock.where).toHaveBeenCalledWith(filterOptions);
    });

    it("orders blocks by number DESC", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("block.number", "DESC");
    });

    it("uses count query that calculates the diff between last and first block with proper filter options", async () => {
      (repositoryMock.findOne as jest.Mock)
        .mockResolvedValueOnce({ number: 100 } as Block)
        .mockResolvedValueOnce({ number: 50 } as Block);

      const result = await service.findAll(filterOptions, pagingOptions);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(2);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: filterOptions,
        order: { number: "DESC" },
        select: { number: true },
      });
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: filterOptions,
        order: { number: "ASC" },
        select: { number: true },
      });
      expect(result.meta.totalItems).toBe(51);
    });

    describe("if there are no blocks", () => {
      it("returns zero as total items", async () => {
        const result = await service.findAll(filterOptions, pagingOptions);
        expect(result.meta.totalItems).toBe(0);
      });
    });

    it("returns paginated result", async () => {
      const paginationResult = mock<Pagination<Block, IPaginationMeta>>();
      (utils.paginate as jest.Mock).mockResolvedValueOnce(paginationResult);

      const result = await service.findAll(filterOptions, pagingOptions);
      expect(utils.paginate).toBeCalledTimes(1);
      expect(utils.paginate).toBeCalledWith(queryBuilderMock, pagingOptions, expect.any(Function));
      expect(result).toBe(paginationResult);
    });
  });

  describe("getBlockNumber", () => {
    it("returns undefined if no blocks are found", async () => {
      jest.spyOn(repositoryMock, "findOne").mockResolvedValue(null);
      const blockNumber = await service.getBlockNumber({ timestamp: new Date() }, { timestamp: "ASC" });
      expect(blockNumber).toBeUndefined();
    });

    it("returns block number for the found block", async () => {
      jest.spyOn(repositoryMock, "findOne").mockResolvedValue({
        number: 1000,
      } as Block);
      const whereOpts = { timestamp: new Date() };
      const orderOpts = { timestamp: "ASC" } as FindOptionsOrder<Block>;
      const number = await service.getBlockNumber(whereOpts, orderOpts);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: whereOpts,
        select: {
          number: true,
        },
        order: orderOpts,
      });
      expect(number).toBe(1000);
    });
  });

  describe("findMany", () => {
    let queryBuilderMock;
    let filterOptions: FindManyOptions;

    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<BlockDetails>>({
        getMany: jest.fn().mockResolvedValue([
          {
            number: 1,
            timestamp: new Date("2023-03-03"),
          },
        ]),
      });
      (blockDetailRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);

      filterOptions = {
        miner: "address",
      };
    });

    it("creates query builder with proper params", async () => {
      await service.findMany(filterOptions);
      expect(blockDetailRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(blockDetailRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("block");
    });

    it("selects specified fields", async () => {
      await service.findMany({
        ...filterOptions,
        selectFields: ["number", "timestamp"],
      });
      expect(queryBuilderMock.addSelect).toHaveBeenCalledTimes(1);
      expect(queryBuilderMock.addSelect).toHaveBeenCalledWith(["number", "timestamp"]);
    });

    it("adds where condition for miner when specified", async () => {
      await service.findMany(filterOptions);
      expect(queryBuilderMock.where).toHaveBeenCalledTimes(1);
      expect(queryBuilderMock.where).toHaveBeenCalledWith({
        miner: "address",
      });
    });

    it("does not add where condition for miner when not specified", async () => {
      await service.findMany({});
      expect(queryBuilderMock.where).not.toBeCalled();
    });

    it("sets offset and limit", async () => {
      await service.findMany({
        page: 10,
        offset: 100,
      });
      expect(queryBuilderMock.offset).toHaveBeenCalledTimes(1);
      expect(queryBuilderMock.offset).toHaveBeenCalledWith(900);
      expect(queryBuilderMock.limit).toHaveBeenCalledTimes(1);
      expect(queryBuilderMock.limit).toHaveBeenCalledWith(100);
    });

    it("orders by block number DESC", async () => {
      await service.findMany({});
      expect(queryBuilderMock.orderBy).toHaveBeenCalledTimes(1);
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("block.number", "DESC");
    });

    it("returns block list", async () => {
      const result = await service.findMany({});
      expect(queryBuilderMock.getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          number: 1,
          timestamp: new Date("2023-03-03"),
        },
      ]);
    });
  });
});
