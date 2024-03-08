import { config } from "dotenv";
import { DataSource } from "typeorm";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { setTimeout } from "timers/promises";
import { typeOrmModuleOptions } from "../typeorm.config";
import logger from "../logger";

config();

const QUERY_MAX_RETRIES = 5;
const QUERY_RETRY_MIN_INTERVAL_MS = 1000;

// eslint-disable-next-line prefer-const
let { fromTransferNumber, toTransferNumber, updateBatchSize, parallelWorkers } = yargs(hideBin(process.argv))
  .options({
    fromTransferNumber: {
      default: 0,
      type: "number",
    },
    toTransferNumber: {
      default: 0,
      type: "number",
    },
    updateBatchSize: {
      default: 4000,
      type: "number",
    },
    parallelWorkers: {
      default: 50,
      type: "number",
    },
  })
  .parseSync();

const updateAddressTransfers = async (dataSource: DataSource, from: number, to: number, attempt = 0): Promise<void> => {
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
    return updateAddressTransfers(dataSource, from, to, attempt + 1);
  }
};

const main = async () => {
  const typeOrmCliDataSource = new DataSource(typeOrmModuleOptions);
  await typeOrmCliDataSource.initialize();

  if (!toTransferNumber) {
    const lastTransferNumber = await typeOrmCliDataSource.query(
      `Select "number" from "transfers" order by "number" DESC limit 1;`
    );
    toTransferNumber = parseInt(lastTransferNumber[0].number, 10);
  }
  logger.log(
    `Starting migration with params: { fromTransferNumber: ${fromTransferNumber}, toTransferNumber: ${toTransferNumber}, updateBatchSize: ${updateBatchSize}, parallelWorkers: ${parallelWorkers} }`
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
      tasks.push(updateAddressTransfers(typeOrmCliDataSource, batchStartNumber, batchEndNumber));
    }
    await Promise.all(tasks);

    logger.log(
      `Updated address transfers from ${cursor} to ${
        cursor + parallelWorkers * updateBatchSize
      }. Time: ${new Date().toJSON()}.`
    );
    cursor = cursor + parallelWorkers * updateBatchSize;
  }
};

main()
  .then(() => {
    logger.log(`Migration script 1709722093204-AddAddressTransferType executed successfully.`);
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Migration script 1709722093204-AddAddressTransferType failed.`);
    logger.error(error);
    process.exit(0);
  });
