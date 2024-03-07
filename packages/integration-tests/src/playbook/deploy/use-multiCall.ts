import * as ethers from "ethers";
import { Provider } from "zksync-web3";

import { localConfig } from "../../config";
import { Buffer, Path } from "../../constants";
import { Helper } from "../../helper";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  const helper = new Helper();
  const TRANSFER_CONTRACT_ADDRESS = await helper.readFile(
    Path.absolutePathToBufferFiles,
    Buffer.addressMultiCallCaller
  );
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

  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txUseMultiCallContracts, txHash);

  return txHash;
}
