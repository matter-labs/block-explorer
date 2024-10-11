// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config({ path: __dirname + "/.env" });

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import { localConfig } from "../config";

import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  zksolc: {
    version: "latest",
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
    version: "0.8.17",
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
