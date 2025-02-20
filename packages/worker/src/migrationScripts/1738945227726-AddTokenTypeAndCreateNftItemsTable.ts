import { config } from "dotenv";
import { DataSource } from "typeorm";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { typeOrmModuleOptions } from "../typeorm.config";
import logger from "../logger";
import { TokenType } from "../entities/token.entity";
import { Contract, Interface } from "ethers";
import { Provider } from "zksync-ethers";

config();

const QUERY_MAX_RETRIES = 5;
const QUERY_RETRY_MIN_INTERVAL_MS = 1000;

let { fromTransferNumber, toTransferNumber, updateBatchSize, blockChainUrl } = yargs(hideBin(process.argv))
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
    blockChainUrl: {
      default: "https://mainnet.era.zksync.io",
      type: "string",
    },
  })
  .parseSync();

const processBatch = async (dataSource: DataSource, start: number, end: number) => {
  const transfers = await dataSource.query(
    `SELECT * FROM transfers WHERE number >= $1 AND number < $2 AND "tokenType" = 'ERC721'`,
    [start, end]
  );

  for (const transfer of transfers) {
    const tokenAddress = `0x${Buffer.from(transfer.tokenAddress).toString("hex")}`;
    const existingNftItem = await dataSource.query(
      `SELECT * FROM nftitems WHERE "tokenAddress" = $1 AND "tokenId" = $2`,
      [transfer.tokenAddress, transfer.fields.tokenId]
    );

    if (existingNftItem.length === 0) {
      const tokenAddress = `0x${Buffer.from(transfer.tokenAddress).toString("hex")}`;
      const contract = new Contract(
        tokenAddress,
        new Interface(`[{
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }]`),
        new Provider(blockChainUrl)
      );
      const metadataUrl = await contract.tokenURI(transfer.fields.tokenId);
      const metadata = await fetchMetadata(metadataUrl);

      const formattedUri =
        metadata?.image && metadata?.image.includes("ipfs://")
          ? metadata?.image.replace("ipfs://", "https://ipfs.io/ipfs/")
          : metadata?.image;
      await dataSource.query(
        `INSERT INTO nftitems ("tokenAddress", "tokenId", owner, "metadataUrl", name, description, "imageUrl") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          transfer.tokenAddress,
          transfer.fields.tokenId,
          transfer.to,
          metadataUrl,
          metadata?.name,
          metadata?.description,
          formattedUri,
        ]
      );
      logger.log(`Created NFT item for tokenAddress: ${tokenAddress}, tokenId: ${transfer.fields.tokenId}`);
    } else {
      await dataSource.query(`UPDATE nftitems SET owner = $1 WHERE "tokenAddress" = $2 AND "tokenId" = $3`, [
        transfer.to,
        transfer.tokenAddress,
        transfer.tokenId,
      ]);
      logger.log(`Updated NFT item for tokenAddress: ${tokenAddress}, tokenId: ${transfer.fields.tokenId}`);
    }

    const token = await dataSource.query(`SELECT * FROM tokens WHERE "l2Address" = $1`, [transfer.tokenAddress]);

    if (token.length > 0 && token[0].type !== TokenType.ERC721) {
      await dataSource.query(`UPDATE tokens SET type = $1 WHERE "l2Address" = $2`, [
        TokenType.ERC721,
        transfer.tokenAddress,
      ]);
      logger.log(`Updated token type to ERC721 for tokenAddress: ${tokenAddress}`);
    }

    if (token.length === 0) {
      const contract = new Contract(
        tokenAddress,
        ["function symbol() view returns (string)", "function name() view returns (string)"],
        new Provider(blockChainUrl)
      );
      const [symbol, name] = await Promise.all([contract.symbol(), contract.name()]);
      await dataSource.query(
        `INSERT INTO tokens ("l2Address", "l1Address", name, symbol, decimals, "blockNumber", "transactionHash", "logIndex", type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          transfer.tokenAddress,
          null,
          name,
          symbol,
          0,
          transfer.blockNumber,
          transfer.transactionHash,
          transfer.logIndex,
          TokenType.ERC721,
        ]
      );
      logger.log(`Created token with type ERC721 for tokenAddress: ${tokenAddress}`);
    }
  }
};

const main = async () => {
  const dataSource = new DataSource(typeOrmModuleOptions);
  await dataSource.initialize();

  if (toTransferNumber === 0) {
    const lastTransfer = await dataSource.query(
      `SELECT * FROM transfers WHERE "tokenType" = 'ERC721' ORDER BY number DESC LIMIT 1`
    );
    toTransferNumber = lastTransfer[0].number;
  }

  for (let i = fromTransferNumber; i <= toTransferNumber; i += updateBatchSize) {
    await processBatch(dataSource, i, i + updateBatchSize);
  }

  await dataSource.destroy();
};

async function fetchMetadata(uri: string): Promise<any> {
  if (!uri) {
    return null;
  }
  const formattedUri = uri.includes("ipfs://") ? uri.replace("ipfs://", "https://ipfs.io/ipfs/") : uri;
  try {
    const response = await fetch(formattedUri);
    return await response.json();
  } catch (error) {
    logger.log("Could not fetch metadata for NFT with URI: " + formattedUri);
    return null;
  }
}

main()
  .then(() => {
    logger.log(`Migration script 1738945227726-AddTokenTypeAndCreateNftItemsTable executed successfully.`);
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Migration script 1738945227726-AddTokenTypeAndCreateNftItemsTable failed.`);
    logger.error(error);
    process.exit(1);
  });
