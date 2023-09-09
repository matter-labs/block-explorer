import { Controller, Get, Query, UseFilters } from "@nestjs/common";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { LessThanOrEqual, MoreThanOrEqual, FindOptionsOrder, FindOptionsWhere } from "typeorm";
import { BlockService } from "../../block/block.service";
import { Block } from "../../block/block.entity";
import { ResponseStatus, ResponseMessage, ResponseResultMessage } from "../dtos/common/responseBase.dto";
import { ApiExceptionFilter } from "../exceptionFilter";
import { BlockNumberResponseDto } from "../dtos/block/blockNumberResponse.dto";
import { BlockCountdownResponseDto } from "../dtos/block/blockCountdownResponse.dto";
import { BlockRewardResponseDto } from "../dtos/block/blockRewardResponse.dto";
import { ParseLimitedIntPipe } from "../../common/pipes/parseLimitedInt.pipe";
import { dateToTimestamp } from "../../common/utils";

const entityName = "block";

@ApiExcludeController()
@ApiTags(entityName)
@Controller(`api/${entityName}`)
@UseFilters(ApiExceptionFilter)
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get("/getblocknobytime")
  public async getBlockNumberByTimestamp(
    @Query("timestamp")
    timestamp: number,
    @Query("closest")
    closest: "before" | "after" = "before"
  ): Promise<BlockNumberResponseDto> {
    if (!["before", "after"].includes(closest) || timestamp < 0 || timestamp > 9999999999) {
      return {
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: ResponseResultMessage.INVALID_PARAM,
      };
    }

    const timestampDate = new Date(timestamp * 1000);
    const filterOption: FindOptionsWhere<Block> = {
      timestamp: closest === "before" ? LessThanOrEqual(timestampDate) : MoreThanOrEqual(timestampDate),
    };

    const orderOption: FindOptionsOrder<Block> = {
      timestamp: closest === "before" ? "DESC" : "ASC",
    };

    const blockNumber = await this.blockService.getBlockNumber(filterOption, orderOption);
    if (blockNumber !== undefined) {
      return {
        status: ResponseStatus.OK,
        message: ResponseMessage.OK,
        result: blockNumber.toString(),
      };
    }

    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.NOTOK,
      result: "Error! No closest block found",
    };
  }

  @Get("/getblockcountdown")
  public async getBlockCountdown(
    @Query("blockno", new ParseLimitedIntPipe())
    blockNumber: number
  ): Promise<BlockCountdownResponseDto> {
    const currentBlockNumber = await this.blockService.getLastBlockNumber();
    if (blockNumber <= currentBlockNumber) {
      return {
        status: ResponseStatus.NOTOK,
        message: ResponseMessage.NOTOK,
        result: "Error! Block number already pass",
      };
    }

    const blockNumbersDiff = blockNumber - currentBlockNumber;
    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: {
        CurrentBlock: currentBlockNumber.toString(),
        CountdownBlock: blockNumber.toString(),
        RemainingBlock: blockNumbersDiff.toString(),
        EstimateTimeInSec: blockNumbersDiff.toString(),
      },
    };
  }

  @Get("/getblockreward")
  public async getBlockReward(
    @Query("blockno", new ParseLimitedIntPipe())
    blockNumber: number
  ): Promise<BlockRewardResponseDto> {
    const block = await this.blockService.findOne(blockNumber, ["number", "timestamp", "miner"], { batch: false });
    if (!block) {
      return {
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
      };
    }

    return {
      status: ResponseStatus.OK,
      message: ResponseMessage.OK,
      result: {
        blockNumber: block.number.toString(),
        timeStamp: dateToTimestamp(block.timestamp).toString(),
        blockMiner: block.miner,
        // There is no such term as block reward for now.
        blockReward: "0",
        // There are no uncles in zkSync.
        uncles: [],
        uncleInclusionReward: "0",
      },
    };
  }
}
