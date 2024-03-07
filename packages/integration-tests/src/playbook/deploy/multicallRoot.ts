import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { promises as fs } from "fs";

import { Buffer } from "../../entities";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the Greeter contract`);

  const wallet = await getWallet(hre);

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Root");

  // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
  // `greeting` is an argument for contract constructor.
  const greeting = "Hi from root!";
  const contractConstructorArguments = [greeting];
  console.log(`Arguments for the contract constructor: ${JSON.stringify(contractConstructorArguments)}`);
  const deployedContract = await deployer.deploy(artifact, contractConstructorArguments);

  // Show the contract info.
  console.log(`Contract "${artifact.contractName}" was deployed to ${deployedContract.address}`);

  // Call the deployed contract.
  const greetingFromContract = await deployedContract.greet();
  if (greetingFromContract == greeting) {
    console.log(`Contract greets us with ${greeting}!`);
  } else {
    console.error(`Contract said something unexpected: ${greetingFromContract}`);
  }

  // Edit the greeting of the contract
  const newGreeting = "New Root";
  const setNewGreetingHandle = await deployedContract.setGreeting(newGreeting);
  await setNewGreetingHandle.wait(1);

  const newGreetingFromContract = await deployedContract.greet();
  if (newGreetingFromContract == newGreeting) {
    console.log(`Contract greets us with ${newGreeting}!`);
  } else {
    console.error(`Contract said something unexpected: ${newGreetingFromContract}`);
  }

  const address = deployedContract.address;
  const txHash = deployedContract.deployTransaction.hash;

  await fs.writeFile(Buffer.addressMultiCallRoot, address);
  await fs.writeFile(Buffer.txMultiCallRoot, txHash);

  return [address, txHash];
}
