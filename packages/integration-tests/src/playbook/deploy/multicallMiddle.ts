import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { promises as fs } from "fs";

import { Buffer } from "../../entities";
import { Helper } from "../../helper";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the contract`);

  const helper = new Helper();
  const playbookRoot = "src/playbook/";
  const wallet = await getWallet(hre);

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Middle");

  // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
  const addressContractRoot = await helper.getStringFromFile(playbookRoot + Buffer.addressMultiCallRoot);
  const contractConstructorArguments = [addressContractRoot];
  console.log(`Arguments for the contract constructor: ${JSON.stringify(contractConstructorArguments)}`);
  const deployedContract = await deployer.deploy(artifact, contractConstructorArguments);

  // Show the contract info.
  console.log(`Contract "${artifact.contractName}" was deployed to ${deployedContract.address}`);

  // Call the deployed contract.
  const greetingFromContract = await deployedContract.callGreeter();

  console.log(`Contract said something like this: ${greetingFromContract}`);

  const address = deployedContract.address;
  const txHash = deployedContract.deployTransaction.hash;

  await fs.writeFile(Buffer.addressMultiCallMiddle, address);
  await fs.writeFile(Buffer.txMultiCallMiddle, txHash);

  return [address, txHash];
}