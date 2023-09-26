// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config({ path: __dirname + "/.env" });

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@nomiclabs/hardhat-ethers";
import { localConfig } from "../config";

import type { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.3.9",
    compilerSource: "binary",
    settings: {},
  },
  defaultNetwork: "zkSyncTestnet",

  networks: {
    zkSyncTestnet: {
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
