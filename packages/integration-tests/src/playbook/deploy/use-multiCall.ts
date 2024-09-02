import * as ethers from "ethers";
import { promises as fs } from "fs";
import { Provider } from "zksync-ethers";

import { localConfig } from "../../config";
import { Buffer } from "../../entities";
import { Helper } from "../../helper";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  const helper = new Helper();
  const playbookRoot = "src/playbook/";
  const TRANSFER_CONTRACT_ADDRESS = await helper.getStringFromFile(playbookRoot + Buffer.addressMultiCallCaller);
  const CONTRACT_NAME = "GCaller";

  console.log(`Running deploy script for the contract`);
  const provider = new Provider(localConfig.L2Network);
  const wallet = await (await getWallet(hre)).connect(provider);
  const factoryArtifact = await hre.artifacts.readArtifact(CONTRACT_NAME);

  const attachedContract = new ethers.Contract(TRANSFER_CONTRACT_ADDRESS, factoryArtifact.abi, wallet);
  console.log(`Contract said something like this by default: ${await attachedContract.newCallGreeter()}`);
  const newGreet = "New Greet!";
  const setNewGreetingHandle = await attachedContract.newSetGreet(newGreet, localConfig.gasLimit);
  await setNewGreetingHandle.wait(1);

  const txHash = setNewGreetingHandle.hash;

  console.log("Multicall contract caller: ", txHash);
  console.log(`Contract said after new greeting: ${await attachedContract.newCallGreeter()}`);

  await fs.writeFile(Buffer.txUseMultiCallContracts, txHash);

  return txHash;
}
