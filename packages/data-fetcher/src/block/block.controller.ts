import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { ParseLimitedIntPipe } from "../common/pipes/parseLimitedInt.pipe";
import { BlockService, BlockData } from "./";

@Controller("blocks")
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get("")
  public async getBlocks(
    @Query("from", new ParseLimitedIntPipe({ min: 0 })) from: number,
    @Query("to", new ParseLimitedIntPipe({ min: 0, isOptional: true })) to: number | null
  ): Promise<BlockData[]> {
    to = to || from;
    if (to < from) {
      throw new BadRequestException(`To block is less than from block`);
    }

    if (to - from > 10) {
      throw new BadRequestException(`Max supported batch is 20`);
    }

    const getBlockDataPromises = [];
    for (let blockNumber = from; blockNumber <= to; blockNumber++) {
      getBlockDataPromises.push(this.blockService.getData(blockNumber));
    }

    return await Promise.all(getBlockDataPromises);
  }
}
