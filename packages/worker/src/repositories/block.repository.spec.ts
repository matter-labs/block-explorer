import { Test, TestingModule } from "@nestjs/testing";
import { EntityManager, SelectQueryBuilder } from "typeorm";
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
        getRawOne: jest.fn().mockResolvedValue({
          count: 50,
        }),
      });

      (entityManagerMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
    });

    it("returns count of missing blocks", async () => {
      const result = await repository.getMissingBlocksCount();
      expect(result).toBe(50);
    });

    it("returns 0 when count is not defined", async () => {
      (queryBuilderMock.getRawOne as jest.Mock).mockResolvedValueOnce({ count: null });
      const result = await repository.getMissingBlocksCount();
      expect(result).toBe(0);
    });

    it("runs proper query to calculate missing blocks", async () => {
      await repository.getMissingBlocksCount();
      expect(queryBuilderMock.select).toBeCalledWith("MAX(number) - COUNT(number) + 1 AS count");
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
});
