import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@nomiclabs/hardhat-ethers";
import * as fs from "fs";

import { localConfig } from "../config";
import { Wallets } from "../entities";

import type { HardhatUserConfig } from "hardhat/types";

const envFilePath = `${__dirname}/.env`;
if (fs.existsSync(envFilePath)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config({ path: envFilePath });
} else {
  process.env.WALLET_PRIVATE_KEY = Wallets.richWalletPrivateKey;
}

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.3.9",
    compilerSource: "binary",
    settings: {},
  },
  defaultNetwork: "zkSyncLocal",

  networks: {
    zkSyncLocal: {
      url: localConfig.L2Network,
      ethNetwork: localConfig.L1Network,
      zksync: true,
    },
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
};

export default config;
