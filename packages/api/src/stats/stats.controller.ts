import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOkResponse, ApiExcludeController } from "@nestjs/swagger";
import { Not, IsNull } from "typeorm";
import { BatchService } from "../batch/batch.service";
import { BlockService } from "../block/block.service";
import { TransactionService } from "../transaction/transaction.service";
import { StatsDto } from "./stats.dto";
import { swagger } from "../config/featureFlags";

const entityName = "stats";

@ApiTags("Stats BFF")
@ApiExcludeController(!swagger.bffEnabled)
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
