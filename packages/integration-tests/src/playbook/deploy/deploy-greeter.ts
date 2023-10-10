import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { promises as fs } from "fs";

import { localConfig } from "../../config";
import { Buffer } from "../../entities";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = await getWallet(hre);

  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Greeter");
  const contract = await deployer.deploy(artifact, [], localConfig.gasLimit);
  const contractAddress = contract.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);
  await fs.writeFile(Buffer.greeterL2, contractAddress);
}
