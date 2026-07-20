import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { BaseRepository } from "./base.repository";
import { BlockQueueRepository } from "./blockQueue.repository";
import { UnitOfWork } from "../unitOfWork";
import { BlockQueue } from "../entities";

describe("BlockQueueRepository", () => {
  let repository: BlockQueueRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        BlockQueueRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<BlockQueueRepository>(BlockQueueRepository);
  });

  it("extends BaseRepository<BlockQueue>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<BlockQueue>);
  });

  describe("enqueueRange", () => {
    it("inserts block numbers from the range with ON CONFLICT DO NOTHING", async () => {
      await repository.enqueueRange(10, 15);
      expect(entityManagerMock.query).toHaveBeenCalledWith(
        `INSERT INTO "blockQueue" ("blockNumber") SELECT generate_series($1::bigint, $2::bigint) ON CONFLICT ("blockNumber") DO NOTHING`,
        [10, 15]
      );
    });

    it("does nothing when fromBlockNumber is greater than toBlockNumber", async () => {
      await repository.enqueueRange(20, 10);
      expect(entityManagerMock.query).not.toHaveBeenCalled();
    });

    it("enqueues a single block when from equals to", async () => {
      await repository.enqueueRange(10, 10);
      expect(entityManagerMock.query).toHaveBeenCalledWith(
        `INSERT INTO "blockQueue" ("blockNumber") SELECT generate_series($1::bigint, $2::bigint) ON CONFLICT ("blockNumber") DO NOTHING`,
        [10, 10]
      );
    });
  });

  describe("enqueue", () => {
    let insertQueryBuilderMock;

    beforeEach(() => {
      insertQueryBuilderMock = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ raw: [] }),
      };
      (entityManagerMock.createQueryBuilder as jest.Mock).mockReturnValue(insertQueryBuilderMock);
    });

    it("inserts rows for each provided block number with orIgnore", async () => {
      await repository.enqueue([10, 11, 12]);
      expect(insertQueryBuilderMock.into).toHaveBeenCalledWith(BlockQueue);
      expect(insertQueryBuilderMock.values).toHaveBeenCalledWith([
        { blockNumber: 10 },
        { blockNumber: 11 },
        { blockNumber: 12 },
      ]);
      expect(insertQueryBuilderMock.orIgnore).toHaveBeenCalled();
      expect(insertQueryBuilderMock.execute).toHaveBeenCalled();
    });

    it("does nothing when the provided list is empty", async () => {
      await repository.enqueue([]);
      expect(entityManagerMock.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe("claim", () => {
    let queryBuilderMock;

    beforeEach(() => {
      queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        setOnLocked: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };
      (entityManagerMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
    });

    it("selects up to batchSize rows FOR UPDATE SKIP LOCKED ordered ascending", async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([]);

      await repository.claim(5);

      expect(queryBuilderMock.select).toHaveBeenCalledWith(`q."blockNumber"`, "blockNumber");
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith(`q."blockNumber"`, "ASC");
      expect(queryBuilderMock.limit).toHaveBeenCalledWith(5);
      expect(queryBuilderMock.setLock).toHaveBeenCalledWith("pessimistic_write");
      expect(queryBuilderMock.setOnLocked).toHaveBeenCalledWith("skip_locked");
    });

    it("returns the claimed block numbers as numbers", async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([
        { blockNumber: "10" },
        { blockNumber: "11" },
        { blockNumber: "12" },
      ]);

      const result = await repository.claim(5);
      expect(result).toEqual([10, 11, 12]);
    });

    it("returns an empty array when there is nothing to claim", async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([]);

      const result = await repository.claim(5);
      expect(result).toEqual([]);
    });
  });

  describe("remove", () => {
    let deleteQueryBuilderMock;

    beforeEach(() => {
      deleteQueryBuilderMock = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ raw: [] }),
      };
      (entityManagerMock.createQueryBuilder as jest.Mock).mockReturnValue(deleteQueryBuilderMock);
    });

    it("deletes rows matching the provided block numbers", async () => {
      await repository.remove([10, 11, 12]);

      expect(deleteQueryBuilderMock.delete).toHaveBeenCalled();
      expect(deleteQueryBuilderMock.from).toHaveBeenCalledWith(BlockQueue);
      expect(deleteQueryBuilderMock.where).toHaveBeenCalledWith(`"blockNumber" IN (:...blockNumbers)`, {
        blockNumbers: [10, 11, 12],
      });
      expect(deleteQueryBuilderMock.execute).toHaveBeenCalled();
    });

    it("does nothing when the provided list is empty", async () => {
      await repository.remove([]);
      expect(entityManagerMock.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
