import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOkResponse, ApiBadRequestResponse, ApiExcludeController, ApiQuery } from "@nestjs/swagger";
import { BlockService } from "../block/block.service";
import { TransactionService } from "../transaction/transaction.service";
import { StatsDto } from "./stats.dto";
import { MonthlyActiveAddressDto } from "./monthlyActiveAddress.dto";
import { MonthlyActiveAddressService } from "./monthlyActiveAddress.service";
import { swagger } from "../config/featureFlags";

const entityName = "stats";
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

@ApiTags("Stats BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class StatsController {
  constructor(
    private readonly blocksService: BlockService,
    private readonly transactionService: TransactionService,
    private readonly monthlyActiveAddressService: MonthlyActiveAddressService
  ) {}

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

  @Get("monthly-active-addresses")
  @ApiQuery({ name: "month", type: String, description: "Calendar month in YYYY-MM format (UTC)", example: "2026-05" })
  @ApiOkResponse({
    description: "Number of unique sending addresses for the given month",
    type: MonthlyActiveAddressDto,
  })
  @ApiBadRequestResponse({ description: "Month query param is missing or not in YYYY-MM format" })
  public async monthlyActiveAddresses(@Query("month") month: string): Promise<MonthlyActiveAddressDto> {
    if (!month || !MONTH_REGEX.test(month)) {
      throw new BadRequestException("month must be in YYYY-MM format");
    }
    const count = await this.monthlyActiveAddressService.getCount(month);
    return { count };
  }
}
