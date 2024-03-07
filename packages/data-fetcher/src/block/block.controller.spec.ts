import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { BadRequestException } from "@nestjs/common";
import { BlockController } from "./block.controller";
import { BlockService } from "./block.service";

describe("BlockController", () => {
  let controller: BlockController;
  let configServiceMock: ConfigService;
  let blockServiceMock: BlockService;

  beforeEach(async () => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(10),
    });
    blockServiceMock = mock<BlockService>();
    const module = await Test.createTestingModule({
      controllers: [BlockController],
      providers: [
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: BlockService,
          useValue: blockServiceMock,
        },
      ],
    }).compile();
    controller = module.get<BlockController>(BlockController);
  });

  describe("getBlocks", () => {
    it("throws an error if requested blocks range is larger than allowed", async () => {
      await expect(controller.getBlocks(0, 11)).rejects.toThrowError(
        new BadRequestException(`Max supported batch is 10.`)
      );
    });

    it("throws an error if to block number is less than from block number", async () => {
      await expect(controller.getBlocks(1, 0)).rejects.toThrowError(
        new BadRequestException(`To block is less than from block.`)
      );
    });

    it("returns blocks information for requested blocks", async () => {
      const blockDetails = [
        {
          block: { number: 3 },
        },
        {
          block: { number: 4 },
        },
        {
          block: { number: 5 },
        },
      ];

      (blockServiceMock.getData as jest.Mock).mockResolvedValueOnce(blockDetails[0]);
      (blockServiceMock.getData as jest.Mock).mockResolvedValueOnce(blockDetails[1]);
      (blockServiceMock.getData as jest.Mock).mockResolvedValueOnce(blockDetails[2]);

      const blocksData = await controller.getBlocks(3, 5);
      expect(blockServiceMock.getData).toHaveBeenCalledTimes(3);
      expect(blockServiceMock.getData).toHaveBeenCalledWith(3);
      expect(blockServiceMock.getData).toHaveBeenCalledWith(4);
      expect(blockServiceMock.getData).toHaveBeenCalledWith(5);

      expect(blocksData).toEqual(blockDetails);
    });

    it("returns block information if only from block is specified", async () => {
      const blockDetails = [
        {
          block: { number: 3 },
        },
      ];

      (blockServiceMock.getData as jest.Mock).mockResolvedValueOnce(blockDetails[0]);

      const blocksData = await controller.getBlocks(3);
      expect(blockServiceMock.getData).toHaveBeenCalledTimes(1);
      expect(blockServiceMock.getData).toHaveBeenCalledWith(3);

      expect(blocksData).toEqual(blockDetails);
    });
  });
});
