import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

import { localConfig } from "../../config";
import { Buffer, Path } from "../../constants";
import { Helper } from "../../helper";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";
const helper = new Helper();

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = await getWallet(hre);

  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Greeter");
  const contract = await deployer.deploy(artifact, [], localConfig.l1GasLimit);
  const contractAddress = contract.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.greeterL2, contractAddress);
}
