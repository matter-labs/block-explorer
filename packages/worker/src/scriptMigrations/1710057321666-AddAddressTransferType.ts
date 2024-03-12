import { DataSource } from "typeorm";
import { Logger } from "@nestjs/common";
import { setTimeout } from "timers/promises";
import { ScriptMigrationRunner } from "../utils/runScriptMigrations";
import { ScriptMigrationRepository } from "../repositories/scriptMigration.repository";
import { ScriptMigrationStatus } from "../entities/scriptMigration.entity";

const QUERY_MAX_RETRIES = 5;
const QUERY_RETRY_MIN_INTERVAL_MS = 1000;

class AddAddressTransferType1710057321666 implements ScriptMigrationRunner {
  public readonly name = "AddAddressTransferType1710057321666";

  public async run(scriptMigrationRepository: ScriptMigrationRepository, dataSource: DataSource, logger: Logger) {
    const scriptMigration = await scriptMigrationRepository.findOneBy({
      name: this.name,
    });

    const params = scriptMigration.params || {};
    const fromTransferNumber = Number(params.fromTransferNumber) || 0;
    let toTransferNumber = Number(params.toTransferNumber) || 0;
    const updateBatchSize = Number(params.updateBatchSize) || 4000;
    const parallelWorkers = Number(params.parallelWorkers) || 50;

    if (!toTransferNumber) {
      const lastTransferNumber = await dataSource.query(
        `Select "number" from "transfers" order by "number" DESC limit 1;`
      );
      toTransferNumber = parseInt(lastTransferNumber[0].number, 10);
    }
    logger.log(
      `Starting migration ${this.name} with params: { fromTransferNumber: ${fromTransferNumber}, toTransferNumber: ${toTransferNumber}, updateBatchSize: ${updateBatchSize}, parallelWorkers: ${parallelWorkers} }`
    );

    let cursor = fromTransferNumber;
    while (cursor <= toTransferNumber) {
      const tasks = [];
      for (let workerIndex = 0; workerIndex < parallelWorkers; workerIndex++) {
        const batchStartNumber = cursor + workerIndex * updateBatchSize;
        if (batchStartNumber > toTransferNumber) {
          break;
        }
        let batchEndNumber = batchStartNumber + updateBatchSize;
        if (batchEndNumber > toTransferNumber) {
          batchEndNumber = toTransferNumber + 1;
        }
        tasks.push(this.updateAddressTransfers(dataSource, logger, batchStartNumber, batchEndNumber));
      }
      await Promise.all(tasks);

      logger.log(
        `Updated address transfers from ${cursor} to ${
          cursor + parallelWorkers * updateBatchSize
        }. Time: ${new Date().toJSON()}.`
      );
      await scriptMigrationRepository.update(
        { number: scriptMigration.number },
        {
          params: {
            fromTransferNumber: (cursor + parallelWorkers * updateBatchSize).toString(),
            toTransferNumber: toTransferNumber.toString(),
            updateBatchSize: updateBatchSize.toString(),
            parallelWorkers: parallelWorkers.toString(),
          },
        }
      );
      cursor = cursor + parallelWorkers * updateBatchSize;
    }
  }

  private async updateAddressTransfers(
    dataSource: DataSource,
    logger: Logger,
    from: number,
    to: number,
    attempt = 0
  ): Promise<void> {
    try {
      await dataSource.query(
        `Update "addressTransfers"
        Set "type" = "transfers".type::VARCHAR::"addressTransfers_type_enum"
        From "transfers"
        WHERE "transfers"."number" = "addressTransfers"."transferNumber"
        AND "transfers"."number" >= ${from}
        AND "transfers"."number" < ${to}
        AND "transfers"."type" != 'transfer'`
      );
    } catch (error) {
      if (attempt >= QUERY_MAX_RETRIES) {
        logger.error(`Failed to update AddressTransfers from ${from} to ${to} after ${QUERY_MAX_RETRIES} retries.`);
        throw error;
      }
      await setTimeout(QUERY_RETRY_MIN_INTERVAL_MS * Math.pow(2, attempt));
      logger.error(`Failed to update AddressTransfers from ${from} to ${to}, retrying...`);
      return this.updateAddressTransfers(dataSource, logger, from, to, attempt + 1);
    }
  }
}

export default new AddAddressTransferType1710057321666();
