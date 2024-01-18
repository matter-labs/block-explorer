import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ParseLimitedIntPipe } from "../common/pipes/parseLimitedInt.pipe";
import { BlockService, BlockData } from "./";

@Controller("blocks")
export class BlockController {
  private readonly maxBlocksBatchSize: number;

  constructor(configService: ConfigService, private readonly blockService: BlockService) {
    this.maxBlocksBatchSize = configService.get<number>("maxBlocksBatchSize");
  }

  @Get("")
  public async getBlocks(
    @Query("from", new ParseLimitedIntPipe({ min: 0 })) from: number,
    @Query("to", new ParseLimitedIntPipe({ min: 0, isOptional: true })) to?: number | null
  ): Promise<BlockData[]> {
    to = to != null ? to : from;

    if (to < from) {
      throw new BadRequestException("To block is less than from block.");
    }

    // +1 since from and to are inclusive
    if (to - from + 1 > this.maxBlocksBatchSize) {
      throw new BadRequestException(`Max supported batch is ${this.maxBlocksBatchSize}.`);
    }

    const getBlockDataPromises = [];
    for (let blockNumber = from; blockNumber <= to; blockNumber++) {
      getBlockDataPromises.push(this.blockService.getData(blockNumber));
    }

    return await Promise.all(getBlockDataPromises);
  }
}
