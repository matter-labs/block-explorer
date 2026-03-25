import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { Log } from "../entities";
import { VisibleLogRepository } from "./visibleLog.repository";
import { extractAddressFromTopic } from "../utils/extractAddressFromTopic";

@Injectable()
export class LogRepository extends BaseRepository<Log> {
  public constructor(
    unitOfWork: UnitOfWork,
    private readonly visibleLogRepository: VisibleLogRepository,
    private readonly configService: ConfigService
  ) {
    super(Log, unitOfWork);
  }

  public override async addMany(records: Partial<Log>[]): Promise<void> {
    await super.addMany(records);

    if (
      this.configService.get("prividium.enabled") &&
      !this.configService.get("prividium.disableTxVisibilityByTopics")
    ) {
      await this.visibleLogRepository.addMany(buildVisibleLogRows(records));
    }
  }
}

const buildVisibleLogRows = (records: Partial<Log>[]) => {
  const rows = [];
  for (const log of records) {
    const viewers = new Set<string>();
    if (log.transactionFrom) viewers.add(log.transactionFrom.toLowerCase());
    if (log.transactionTo) viewers.add(log.transactionTo.toLowerCase());
    if (log.address) viewers.add(log.address.toLowerCase());
    for (let t = 1; t <= 3; t++) {
      const addr = extractAddressFromTopic(log.topics?.[t]);
      if (addr) viewers.add(addr.toLowerCase());
    }
    for (const visibleBy of viewers) {
      rows.push({
        logNumber: Number(log.number),
        transactionHash: log.transactionHash,
        address: log.address,
        logIndex: log.logIndex,
        visibleBy,
        blockNumber: log.blockNumber,
        timestamp: log.timestamp,
      });
    }
  }
  return rows;
};
