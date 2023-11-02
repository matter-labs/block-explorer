import { config } from "dotenv";
import * as path from "path";
import * as fs from "node:fs";
import { getLogger } from "../../logger";

config();

const { NETWORK_NAME } = process.env;

const defaultDocsConstants = {
  verifiedContractAddress: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
  verifiedContractAddress2: "0x0E03197d697B592E5AE49EC14E952cddc9b28e14",
  contractAddressWithLogs: "0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594",
  txHash: "0x04a4757cd59681b037c1e7bd2402cc45a23c66ed7497614879376719d34e020a",
  address: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
  addressWithInternalTx: "0x0E03197d697B592E5AE49EC14E952cddc9b28e14",
  addressTxWithInternalTransfers: "0x04a4757cd59681b037c1e7bd2402cc45a23c66ed7497614879376719d34e020a",
  tokenAddress: "0x0faF6df7054946141266420b43783387A78d82A9",
  erc20TokenAddress: "0x0faF6df7054946141266420b43783387A78d82A9",
  erc721TokenAddress: "0x09B0196641D91eDEC4042e4bb8C605bb35a02546",
  erc721TokenHolderAddress: "0xFb7E0856e44Eff812A44A9f47733d7d55c39Aa28",
};
let networkDocsConstants = {};

if (NETWORK_NAME) {
  try {
    const networkConstantsFilePath = path.resolve(__dirname, `./constants.${NETWORK_NAME.toLowerCase()}.json`);
    if (fs.existsSync(networkConstantsFilePath)) {
      networkDocsConstants = JSON.parse(fs.readFileSync(networkConstantsFilePath, { encoding: "utf8" }));
    }
  } catch (error) {
    const logger = getLogger(process.env.NODE_ENV, process.env.LOG_LEVEL);
    logger.error(error.message, error.stack, "ConfigDocs");
  }
}

export const constants = {
  ...defaultDocsConstants,
  ...networkDocsConstants,
};
