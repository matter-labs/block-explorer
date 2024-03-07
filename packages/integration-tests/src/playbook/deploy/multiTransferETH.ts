import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { promises as fs } from "fs";

import { Buffer, Wallets } from "../../constants";
import verify from "../utils/displayVerificationInfo";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

const contract_name = "TokenF2L2"; // insert the name of the contract you want to deploy
const constructor_arguments = [Wallets.richWalletAddress]; // insert the constructor arguments of the contract you want to deploy

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the ${contract_name} contract`);

  const wallet = await getWallet(hre);

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact(contract_name);

  // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
  console.log(`Deploying contract with arguments: ${JSON.stringify(constructor_arguments)}`);
  const deployedContract = await deployer.deploy(artifact, constructor_arguments);

  await deployedContract.deployTransaction.wait(2);

  // Show the contract info.
  console.log(`Contract "${artifact.contractName}" was deployed to ${deployedContract.address}`);
  await fs.writeFile(Buffer.addressMultiTransferETH, deployedContract.address);

  await verify({ hre, contract: deployedContract, contractConstructorArguments: constructor_arguments, artifact });

  return deployedContract.address;
}
