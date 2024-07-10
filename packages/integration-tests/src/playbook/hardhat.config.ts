// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config({ path: __dirname + "/.env" });

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@nomiclabs/hardhat-ethers";

import { task } from "hardhat/config";

import { localConfig } from "../config";

import type { HardhatUserConfig } from "hardhat/types";

// Define the custom task
task("accounts", "Prints the list of accounts and their balances", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    const balance = await account.getBalance();
    console.log(`${account.address}: ${hre.ethers.utils.formatEther(balance)} ETH`);
  }
});

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
