import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOkResponse, ApiExcludeController } from "@nestjs/swagger";
import { BlockService } from "../block/block.service";
import { TransactionService } from "../transaction/transaction.service";
import { StatsDto } from "./stats.dto";
import { swagger } from "../config/featureFlags";

const entityName = "stats";

@ApiTags("Stats BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class StatsController {
  constructor(private readonly blocksService: BlockService, private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOkResponse({ description: "Blockchain stats", type: StatsDto })
  public async stats(): Promise<StatsDto> {
    const [lastSealedBlock, lastVerifiedBlock, totalTransactions] = await Promise.all([
      this.blocksService.getLastBlockNumber(),
      this.blocksService.getLastVerifiedBlockNumber(),
      this.transactionService.count(),
    ]);

    return {
      lastSealedBlock,
      lastVerifiedBlock,
      totalTransactions,
    };
  }
}
