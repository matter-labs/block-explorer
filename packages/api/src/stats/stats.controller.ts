import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOkResponse } from "@nestjs/swagger";
import { Not, IsNull } from "typeorm";
import { BatchService } from "../batch/batch.service";
import { BlockService } from "../block/block.service";
import { TransactionService } from "../transaction/transaction.service";
import { StatsDto } from "./stats.dto";

const entityName = "stats";

@ApiTags("Stats BFF")
@Controller(entityName)
export class StatsController {
  constructor(
    private readonly batchService: BatchService,
    private readonly blocksService: BlockService,
    private readonly transactionService: TransactionService
  ) {}

  @Get()
  @ApiOkResponse({ description: "Blockchain stats", type: StatsDto })
  public async stats(): Promise<StatsDto> {
    const [lastSealedBatch, lastVerifiedBatch, lastSealedBlock, lastVerifiedBlock, totalTransactions] =
      await Promise.all([
        this.batchService.getLastBatchNumber(),
        this.batchService.getLastBatchNumber({ executedAt: Not(IsNull()) }),
        this.blocksService.getLastBlockNumber(),
        this.blocksService.getLastVerifiedBlockNumber(),
        this.transactionService.count(),
      ]);

    return {
      lastSealedBatch,
      lastVerifiedBatch,
      lastSealedBlock,
      lastVerifiedBlock,
      totalTransactions,
    };
  }
}
