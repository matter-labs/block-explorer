import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { Logger } from "@nestjs/common";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { BlockService } from "../../block/block.service";
import { ResponseStatus, ResponseMessage, ResponseResultMessage } from "../dtos/common/responseBase.dto";
import { BlockController } from "./block.controller";

describe("BlockController", () => {
  let controller: BlockController;
  let blockServiceMock: BlockService;

  beforeEach(async () => {
    blockServiceMock = mock<BlockService>({
      getBlockNumber: jest.fn().mockResolvedValue(undefined),
    });
    const module = await Test.createTestingModule({
      controllers: [BlockController],
      providers: [
        {
          provide: BlockService,
          useValue: blockServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    controller = module.get<BlockController>(BlockController);
  });

  describe("getBlockNumberByTimestamp", () => {
    it("returns not OK response when timestamp is less than 0", async () => {
      const response = await controller.getBlockNumberByTimestamp(-1);
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: ResponseResultMessage.INVALID_PARAM,
      });
    });

    it("returns not OK response when timestamp is more than 9999999999", async () => {
      const response = await controller.getBlockNumberByTimestamp(9999999999 + 1);
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: ResponseResultMessage.INVALID_PARAM,
      });
    });

    it("returns not OK response when closest is nor before neither after", async () => {
      const response = await controller.getBlockNumberByTimestamp(10, "befor123e" as "before" | "after");
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: ResponseResultMessage.INVALID_PARAM,
      });
    });

    describe("when closest is before", () => {
      const closest = "before";
      const timestamp = 10;

      it("calls service with proper filter and order params", async () => {
        await controller.getBlockNumberByTimestamp(timestamp, closest as "before" | "after");
        expect(blockServiceMock.getBlockNumber).toBeCalledWith(
          {
            timestamp: LessThanOrEqual(new Date(timestamp * 1000)),
          },
          {
            timestamp: "DESC",
          }
        );
      });
    });

    describe("when closest is after", () => {
      const closest = "after";
      const timestamp = 10;

      it("calls service with proper filter and order params", async () => {
        await controller.getBlockNumberByTimestamp(timestamp, closest as "before" | "after");
        expect(blockServiceMock.getBlockNumber).toBeCalledWith(
          {
            timestamp: MoreThanOrEqual(new Date(timestamp * 1000)),
          },
          {
            timestamp: "ASC",
          }
        );
      });
    });

    describe("when there is no block found", () => {
      beforeEach(() => {
        (blockServiceMock.getBlockNumber as jest.Mock).mockResolvedValue(undefined);
      });

      it("returns OK status response with NOTOK message and error result", async () => {
        const response = await controller.getBlockNumberByTimestamp(10);
        expect(response).toEqual({
          status: ResponseStatus.OK,
          message: ResponseMessage.NOTOK,
          result: "Error! No closest block found",
        });
      });
    });

    describe("when there is a block found", () => {
      beforeEach(() => {
        (blockServiceMock.getBlockNumber as jest.Mock).mockResolvedValue(1000);
      });

      it("returns OK status response with OK message and block number", async () => {
        const response = await controller.getBlockNumberByTimestamp(10);
        expect(response).toEqual({
          status: ResponseStatus.OK,
          message: ResponseMessage.OK,
          result: "1000",
        });
      });
    });
  });

  describe("getBlockCountdown", () => {
    beforeEach(() => {
      (blockServiceMock.getLastBlockNumber as jest.Mock).mockResolvedValueOnce(20);
    });

    it("returns not OK response when specified block number already pass", async () => {
      const response = await controller.getBlockCountdown(20);
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: "Error! Block number already pass",
      });
    });

    it("returns OK status response with information about block countdown", async () => {
      const response = await controller.getBlockCountdown(30);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          CurrentBlock: "20",
          CountdownBlock: "30",
          RemainingBlock: "10",
          EstimateTimeInSec: "10",
        },
      });
    });
  });

  describe("getBlockReward", () => {
    it("selects only needed fields for the block record", async () => {
      await controller.getBlockReward(20);
      expect(blockServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(blockServiceMock.findOne).toHaveBeenCalledWith(20, ["number", "timestamp", "miner"], { batch: false });
    });

    it("returns not OK response and result with empty values when specified block number does not exist", async () => {
      (blockServiceMock.findOne as jest.Mock).mockResolvedValueOnce(null);
      const response = await controller.getBlockReward(20);
      expect(response).toEqual({
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NO_RECORD_FOUND,
        result: {
          blockNumber: null,
          timeStamp: null,
          blockMiner: null,
          blockReward: null,
          uncles: null,
          uncleInclusionReward: null,
        },
      });
    });

    it("returns OK status response with information about the block reward", async () => {
      (blockServiceMock.findOne as jest.Mock).mockResolvedValueOnce({
        number: 20,
        timestamp: new Date("2023-08-21T13:05:46.000Z"),
        miner: "0x0000000000000000000000000000000000000000",
      });

      const response = await controller.getBlockReward(20);
      expect(response).toEqual({
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: {
          blockNumber: "20",
          timeStamp: "1692623146",
          blockMiner: "0x0000000000000000000000000000000000000000",
          blockReward: "0",
          uncles: [],
          uncleInclusionReward: "0",
        },
      });
    });
  });
});
