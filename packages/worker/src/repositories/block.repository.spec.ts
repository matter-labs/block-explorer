import { Test, TestingModule } from "@nestjs/testing";
import { EntityManager, SelectQueryBuilder } from "typeorm";
import { mock } from "jest-mock-extended";
import { types } from "zksync-ethers";
import { Block as BlockDto } from "../dataFetcher/types";
import { BlockRepository } from "./block.repository";
import { UnitOfWork } from "../unitOfWork";
import { Block } from "../entities";

describe("BlockRepository", () => {
  let repository: BlockRepository;
  let blockDto: BlockDto;
  let blockDetailsDto: types.BlockDetails;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();

    unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    blockDto = mock<BlockDto>({
      number: 1,
    });

    blockDetailsDto = mock<types.BlockDetails>({
      number: 1,
      timestamp: new Date().getTime() / 1000,
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

  describe("getLastBlock", () => {
    const block = mock<Block>({
      hash: "blockHash",
    });

    describe("when last block exists", () => {
      beforeEach(() => {
        (entityManagerMock.findOne as jest.Mock).mockResolvedValue(block);
      });

      it("returns the block", async () => {
        const lastBlock = await repository.getLastBlock();
        expect(lastBlock).toBe(block);
      });
    });

    describe("when there are no blocks", () => {
      beforeEach(() => {
        (entityManagerMock.findOne as jest.Mock).mockResolvedValue(null);
      });

      it("returns null", async () => {
        const lastBlock = await repository.getLastBlock();
        expect(lastBlock).toBeNull();
      });
    });

    it("uses criteria when criteria is provided", async () => {
      await repository.getLastBlock({ where: { number: 1 } });
      expect(entityManagerMock.findOne).toBeCalledWith(Block, {
        where: { number: 1 },
        order: { number: "DESC" },
      });
    });

    it("uses select options when provided", async () => {
      await repository.getLastBlock({ select: { number: true } });
      expect(entityManagerMock.findOne).toBeCalledWith(Block, {
        where: {},
        select: { number: true },
        order: { number: "DESC" },
      });
    });

    it("uses relations when provided", async () => {
      await repository.getLastBlock({ relations: { batch: true } });
      expect(entityManagerMock.findOne).toBeCalledWith(Block, {
        where: {},
        relations: { batch: true },
        order: { number: "DESC" },
      });
    });
  });

  describe("getLastExecutedBlockNumber", () => {
    let queryBuilderMock: SelectQueryBuilder<Block>;

    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<Block>>({
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          number: 100,
        }),
      });

      (entityManagerMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
    });

    it("returns last executed block number when last executed block exists", async () => {
      const result = await repository.getLastExecutedBlockNumber();
      expect(result).toBe(100);
    });

    it("returns 0 when last executed block does not exist", async () => {
      (queryBuilderMock.getOne as jest.Mock).mockResolvedValueOnce(null);
      const result = await repository.getLastExecutedBlockNumber();
      expect(result).toBe(0);
    });

    it("runs query on blocks joined with batches", async () => {
      await repository.getLastExecutedBlockNumber();
      expect(queryBuilderMock.select).toBeCalledWith("block.number");
      expect(queryBuilderMock.innerJoin).toBeCalledWith("block.batch", "batch");
      expect(queryBuilderMock.where).toBeCalledWith("batch.executedAt IS NOT NULL");
      expect(queryBuilderMock.orderBy).toBeCalledWith("block.number", "DESC");
      expect(queryBuilderMock.limit).toBeCalledWith(1);
      expect(queryBuilderMock.getOne).toBeCalledTimes(1);
    });
  });

  describe("add", () => {
    it("adds the block", async () => {
      await repository.add(blockDto, blockDetailsDto);
      expect(entityManagerMock.insert).toHaveBeenCalledWith(Block, {
        ...blockDto,
        ...blockDetailsDto,
        timestamp: new Date(blockDetailsDto.timestamp * 1000),
      });
    });
  });

  describe("delete", () => {
    it("deletes all blocks matching the provided criteria", async () => {
      await repository.delete({ number: 10 });
      expect(entityManagerMock.delete).toHaveBeenCalledWith(Block, { number: 10 });
    });
  });
});
