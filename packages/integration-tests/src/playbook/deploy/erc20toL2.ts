import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { promises as fs } from "fs";

import { Buffer } from "../../entities";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = await getWallet(hre);

  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("L2");
  const contract = await deployer.deploy(artifact, []);
  const contractAddress = await contract.getAddress();
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);
  await fs.writeFile(Buffer.L2, contractAddress);
  console.log(`deployERC20toL2 - done`);
}
