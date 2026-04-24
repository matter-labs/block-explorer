import { Test, TestingModule } from "@nestjs/testing";
import { EntityManager, SelectQueryBuilder, Between } from "typeorm";
import { mock } from "jest-mock-extended";
import { BlockRepository } from "./block.repository";
import { UnitOfWork } from "../unitOfWork";
import { Block } from "../entities";

describe("BlockRepository", () => {
  let repository: BlockRepository;
  let blockDto: Block;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();

    unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    blockDto = mock<Block>({
      number: 1,
      timestamp: new Date(),
    });

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        BlockRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<BlockRepository>(BlockRepository);
  });

  describe("getBlock", () => {
    const block = mock<Block>({
      hash: "blockHash",
    });

    describe("when last block exists", () => {
      beforeEach(() => {
        (entityManagerMock.findOne as jest.Mock).mockResolvedValue(block);
      });

      it("returns the block", async () => {
        const lastBlock = await repository.getBlock();
        expect(lastBlock).toBe(block);
      });
    });

    describe("when there are no blocks", () => {
      beforeEach(() => {
        (entityManagerMock.findOne as jest.Mock).mockResolvedValue(null);
      });

      it("returns null", async () => {
        const lastBlock = await repository.getBlock();
        expect(lastBlock).toBeNull();
      });
    });

    it("uses criteria when criteria is provided", async () => {
      await repository.getBlock({ where: { number: 1 } });
      expect(entityManagerMock.findOne).toBeCalledWith(Block, {
        where: { number: 1 },
        order: { number: "DESC" },
      });
    });

    it("uses select options when provided", async () => {
      await repository.getBlock({ select: { number: true } });
      expect(entityManagerMock.findOne).toBeCalledWith(Block, {
        where: {},
        select: { number: true },
        order: { number: "DESC" },
      });
    });
  });

  describe("getMissingBlocksCount", () => {
    let queryBuilderMock: SelectQueryBuilder<Block>;

    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<Block>>({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          count: 50,
        }),
      });

      (entityManagerMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
    });

    it("returns count of missing blocks at or below the last ready block", async () => {
      const result = await repository.getMissingBlocksCount(100);
      expect(result).toBe(50);
    });

    it("returns 0 when count is not defined", async () => {
      (queryBuilderMock.getRawOne as jest.Mock).mockResolvedValueOnce({ count: null });
      const result = await repository.getMissingBlocksCount(100);
      expect(result).toBe(0);
    });

    it("runs proper query filtered by last ready block", async () => {
      await repository.getMissingBlocksCount(100);
      expect(queryBuilderMock.select).toBeCalledWith(":lastReadyBlockNumber - COUNT(number) + 1 AS count");
      expect(queryBuilderMock.where).toBeCalledWith("block.number <= :lastReadyBlockNumber", {
        lastReadyBlockNumber: 100,
      });
    });
  });

  describe("getStateAboveLastReadyBlock", () => {
    it("returns firstIncorrectBlockNumber and lastCorrectBlockNumber as numbers", async () => {
      (entityManagerMock.query as jest.Mock).mockResolvedValue([
        { firstIncorrectBlockNumber: "120", lastCorrectBlockNumber: "150" },
      ]);
      const result = await repository.getStateAboveLastReadyBlock(100);
      expect(result).toEqual({ firstIncorrectBlockNumber: 120, lastCorrectBlockNumber: 150 });
    });

    it("returns null for firstIncorrectBlockNumber when chain is valid", async () => {
      (entityManagerMock.query as jest.Mock).mockResolvedValue([
        { firstIncorrectBlockNumber: null, lastCorrectBlockNumber: "150" },
      ]);
      const result = await repository.getStateAboveLastReadyBlock(100);
      expect(result).toEqual({ firstIncorrectBlockNumber: null, lastCorrectBlockNumber: 150 });
    });

    it("returns null for lastCorrectBlockNumber when there are no blocks above the last ready block", async () => {
      (entityManagerMock.query as jest.Mock).mockResolvedValue([
        { firstIncorrectBlockNumber: null, lastCorrectBlockNumber: null },
      ]);
      const result = await repository.getStateAboveLastReadyBlock(100);
      expect(result).toEqual({ firstIncorrectBlockNumber: null, lastCorrectBlockNumber: null });
    });

    it("invokes the query with the provided last ready block number as parameter", async () => {
      (entityManagerMock.query as jest.Mock).mockResolvedValue([
        { firstIncorrectBlockNumber: null, lastCorrectBlockNumber: null },
      ]);
      await repository.getStateAboveLastReadyBlock(100);
      expect(entityManagerMock.query).toHaveBeenCalledWith(expect.any(String), [100]);
    });

    it("uses a chain-validating SQL with LAG over hash", async () => {
      (entityManagerMock.query as jest.Mock).mockResolvedValue([
        { firstIncorrectBlockNumber: null, lastCorrectBlockNumber: null },
      ]);
      await repository.getStateAboveLastReadyBlock(100);
      const [sql] = (entityManagerMock.query as jest.Mock).mock.calls[0];
      expect(sql).toContain(`LAG(hash)`);
      expect(sql).toContain(`prev_hash IS DISTINCT FROM "parentHash"`);
      expect(sql).toContain("number >= $1");
    });
  });

  describe("add", () => {
    it("adds the block", async () => {
      await repository.add(blockDto);
      expect(entityManagerMock.insert).toHaveBeenCalledWith(Block, blockDto);
    });
  });

  describe("delete", () => {
    it("deletes all blocks matching the provided criteria", async () => {
      await repository.delete({ number: 10 });
      expect(entityManagerMock.delete).toHaveBeenCalledWith(Block, { number: 10 });
    });
  });

  describe("deleteWithReturningNumber", () => {
    let deleteQueryBuilderMock;

    beforeEach(() => {
      deleteQueryBuilderMock = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ raw: [] }),
      };
      (entityManagerMock.createQueryBuilder as jest.Mock).mockReturnValue(deleteQueryBuilderMock);
    });

    it("returns deleted block numbers as numbers", async () => {
      deleteQueryBuilderMock.execute.mockResolvedValue({
        raw: [{ number: "10" }, { number: "11" }, { number: "12" }],
      });
      const result = await repository.deleteWithReturningNumber({ number: 10 });
      expect(result).toEqual([10, 11, 12]);
    });

    it("returns an empty array when no rows are deleted", async () => {
      deleteQueryBuilderMock.execute.mockResolvedValue({ raw: [] });
      const result = await repository.deleteWithReturningNumber({ number: 10 });
      expect(result).toEqual([]);
    });

    it("builds a DELETE with the provided where clause and returning number", async () => {
      await repository.deleteWithReturningNumber({ number: 10 });
      expect(deleteQueryBuilderMock.from).toHaveBeenCalledWith(Block);
      expect(deleteQueryBuilderMock.where).toHaveBeenCalledWith({ number: 10 });
      expect(deleteQueryBuilderMock.returning).toHaveBeenCalledWith(`"number"`);
    });
  });

  describe("updateByRange", () => {
    it("updates all blocks using from - to numbers with specified changes", async () => {
      await repository.updateByRange(10, 20, { hash: "new-hash" });
      expect(entityManagerMock.update).toHaveBeenCalledWith(Block, { number: Between(10, 20) }, { hash: "new-hash" });
    });
  });
});
