import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { NotFoundException } from "@nestjs/common";
import { Pagination } from "nestjs-typeorm-paginate";
import { BlockController } from "./block.controller";
import { BlockService } from "./block.service";
import { Block } from "./block.entity";
import { PagingOptionsDto } from "../common/dtos";
import { buildBlockFilter } from "../common/utils";

jest.mock("../common/utils", () => ({
  buildBlockFilter: jest.fn().mockReturnValue({ number: "number" }),
}));

describe("BlockController", () => {
  let controller: BlockController;
  let serviceMock: BlockService;
  let block;
  const blockNumber = 10;

  beforeEach(async () => {
    serviceMock = mock<BlockService>();

    block = {
      number: blockNumber,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockController],
      providers: [
        {
          provide: BlockService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<BlockController>(BlockController);
  });

  describe("getBlocks", () => {
    const blocks = mock<Pagination<Block>>();
    beforeEach(() => {
      (serviceMock.findAll as jest.Mock).mockResolvedValueOnce(blocks);
    });

    it("queries blocks with the specified options", async () => {
      const listFilterOptions = {
        fromBlock: 10,
        toBlock: 100,
      };
      const pagingOptions: PagingOptionsDto = { limit: 10, page: 2 };
      await controller.getBlocks(listFilterOptions, pagingOptions);

      expect(buildBlockFilter).toHaveBeenCalledWith(listFilterOptions.fromBlock, listFilterOptions.toBlock);
      expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
      expect(serviceMock.findAll).toHaveBeenCalledWith(
        { number: "number" },
        { ...pagingOptions, filterOptions: listFilterOptions, route: "blocks", canUseNumberFilterAsOffset: true }
      );
    });

    it("returns the blocks", async () => {
      const listFilterOptions = {
        fromBlock: 10,
        toBlock: 100,
      };
      const pagingOptions: PagingOptionsDto = { limit: 10, page: 2 };
      const result = await controller.getBlocks(listFilterOptions, pagingOptions);
      expect(result).toBe(blocks);
    });
  });

  describe("getBlock", () => {
    describe("when block exists", () => {
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValue(block);
      });

      it("queries blocks by specified block number", async () => {
        await controller.getBlock(blockNumber);
        expect(serviceMock.findOne).toHaveBeenCalledTimes(1);
        expect(serviceMock.findOne).toHaveBeenCalledWith(blockNumber);
      });

      it("returns the block", async () => {
        const result = await controller.getBlock(blockNumber);
        expect(result).toBe(block);
      });
    });

    describe("when block does not exist", () => {
      beforeEach(() => {
        (serviceMock.findOne as jest.Mock).mockResolvedValueOnce(null);
      });

      it("throws NotFoundException", async () => {
        expect.assertions(1);

        try {
          await controller.getBlock(blockNumber);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
        }
      });
    });
  });
});
