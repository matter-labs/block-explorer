import { promises as fs } from "fs";
import { ethers } from "hardhat";
import * as hardhatConfig from "hardhat";

import { localConfig } from "../../config";
import { Buffer, Wallets } from "../../entities";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

async function main() {
  const hre: HardhatRuntimeEnvironment = hardhatConfig;
  const wallet = await getWallet(hre);
  const deployer = wallet.connect(hre.ethers.provider);

  const MyERC20Artifact = await hre.artifacts.readArtifact("L1");
  const MyERC20Factory = new ethers.ContractFactory(MyERC20Artifact.abi, MyERC20Artifact.bytecode, deployer);

  const token = await MyERC20Factory.deploy(Wallets.richWalletAddress, localConfig.gasLimit);
  console.log("Contract deployed to L1 address:", token.address);

  await fs.writeFile(Buffer.L1, token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
