import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, MoreThanOrEqual } from "typeorm";
import { Pagination, IPaginationMeta } from "nestjs-typeorm-paginate";
import * as utils from "../common/utils";
import { BatchService } from "./batch.service";
import { Batch } from "./batch.entity";
import { BatchDetails } from "./batchDetails.entity";

jest.mock("../common/utils");

describe("BatchService", () => {
  const batchRecord = mock<BatchDetails>({
    number: 123,
  });

  let service: BatchService;
  let repositoryMock: Repository<Batch>;
  let batchDetailRepositoryMock: Repository<BatchDetails>;

  beforeEach(async () => {
    repositoryMock = mock<Repository<Batch>>();
    batchDetailRepositoryMock = mock<Repository<BatchDetails>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        {
          provide: getRepositoryToken(Batch),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(BatchDetails),
          useValue: batchDetailRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getLastBatchNumber", () => {
    beforeEach(() => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(batchRecord);
    });

    it("queries batches with default filter options when filter options are not specified", async () => {
      await service.getLastBatchNumber();
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: {},
        order: { number: "DESC" },
        select: ["number"],
      });
    });

    it("queries batches with specified filter options", async () => {
      await service.getLastBatchNumber({ number: 1 });
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          number: 1,
        },
        order: { number: "DESC" },
        select: ["number"],
      });
    });

    it("returns last batch number", async () => {
      const result = await service.getLastBatchNumber();
      expect(result).toBe(batchRecord.number);
    });

    it("returns zero when there are no batches", async () => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.getLastBatchNumber();
      expect(result).toBe(0);
    });
  });

  describe("findOne", () => {
    beforeEach(() => {
      (batchDetailRepositoryMock.findOneBy as jest.Mock).mockResolvedValue(batchRecord);
    });

    it("queries DB with correct params and return batch", async () => {
      const result = await service.findOne(batchRecord.number);

      expect(batchDetailRepositoryMock.findOneBy).toHaveBeenCalledTimes(1);
      expect(batchDetailRepositoryMock.findOneBy).toHaveBeenCalledWith({ number: batchRecord.number });
      expect(result).toBe(batchRecord);
    });
  });

  describe("findAll", () => {
    const filterOptions = {
      timestamp: MoreThanOrEqual(new Date("2020-04-25T00:43:26.000Z")),
    };
    const pagingOptions = {
      filterOptions: {
        fromDate: "2020-04-25T00:43:26.000Z",
      },
      limit: 10,
      page: 2,
    };

    let queryBuilderMock: SelectQueryBuilder<Batch>;

    beforeEach(() => {
      (utils.paginate as jest.Mock).mockImplementation(async (_, __, getCount) => {
        const count = await getCount();
        return mock<Pagination<Batch, IPaginationMeta>>({
          meta: {
            totalItems: count,
          },
        });
      });

      queryBuilderMock = mock<SelectQueryBuilder<Batch>>({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      });

      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(null);
    });

    it("creates query builder with correct params", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("batch");
      expect(queryBuilderMock.where).toHaveBeenCalledWith(filterOptions);
    });

    it("orders batches by number DESC", async () => {
      await service.findAll(filterOptions, pagingOptions);
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("batch.number", "DESC");
    });

    it("uses count query that calculates the diff between last and first block with proper filter options", async () => {
      (repositoryMock.findOne as jest.Mock)
        .mockResolvedValueOnce({ number: 100 } as Batch)
        .mockResolvedValueOnce({ number: 50 } as Batch);

      const result = await service.findAll(filterOptions, pagingOptions);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(2);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: filterOptions,
        order: { number: "DESC" },
        select: ["number"],
      });
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: filterOptions,
        order: { number: "ASC" },
        select: ["number"],
      });
      expect(result.meta.totalItems).toBe(51);
    });

    describe("if there are no batches", () => {
      it("returns zero as total items", async () => {
        const result = await service.findAll(filterOptions, pagingOptions);
        expect(result.meta.totalItems).toBe(0);
      });
    });

    it("returns paginated result", async () => {
      const paginationResult = mock<Pagination<Batch, IPaginationMeta>>();
      (utils.paginate as jest.Mock).mockResolvedValueOnce(paginationResult);

      const result = await service.findAll(filterOptions, pagingOptions);
      expect(utils.paginate).toBeCalledTimes(1);
      expect(utils.paginate).toBeCalledWith(queryBuilderMock, pagingOptions, expect.any(Function));
      expect(result).toBe(paginationResult);
    });
  });
});
