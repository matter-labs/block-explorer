import { config } from "dotenv";
import { DataSource } from "typeorm";
import logger from "../logger";
import { typeOrmModuleOptions } from "../typeorm.config";
import { JsonRpcProvider } from "ethers";

config();

const run = async (dataSource: DataSource): Promise<void> => {
  const balancesToUpdate = await dataSource.query(
    `SELECT encode(latest_txs.address, 'hex') as address, latest_txs."latestTxBlock"
    FROM (
      SELECT t.from AS address, MAX(t."blockNumber") AS "latestTxBlock"
      FROM transactions t
      GROUP BY t.from
    ) AS latest_txs
    LEFT JOIN balances b 
      ON b.address = latest_txs.address
      AND b."tokenAddress" = decode('000000000000000000000000000000000000800a', 'hex')
      AND b."blockNumber" >= latest_txs."latestTxBlock"
    WHERE b.address IS NULL
    Order by "latestTxBlock"`
  );

  const provider = new JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

  for (const balance of balancesToUpdate) {
    const blockNumber = parseInt(balance.latestTxBlock, 10);
    const newBalance = await provider.getBalance(`0x${balance.address}`, blockNumber);
    if (newBalance > 0) {
      await dataSource.query(
        `INSERT INTO balances (address, "tokenAddress", "blockNumber", balance) VALUES (decode($1, 'hex'), decode('000000000000000000000000000000000000800a', 'hex'), $2, $3)`,
        [balance.address, blockNumber, newBalance.toString()]
      );
    }
  }
};

const main = async () => {
  const typeOrmCliDataSource = new DataSource(typeOrmModuleOptions);
  await typeOrmCliDataSource.initialize();
  await run(typeOrmCliDataSource);
};

main()
  .then(() => {
    logger.log(`Migration script 1772146793236-UpdateBalances executed successfully.`);
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Migration script 1772146793236-UpdateBalances failed.`);
    logger.error(error);
    process.exit(0);
  });
