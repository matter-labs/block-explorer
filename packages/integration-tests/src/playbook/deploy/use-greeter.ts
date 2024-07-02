import { Contract, Provider, Wallet } from "zksync-web3";

import { localConfig } from "../../config";
import { Path, Wallets } from "../../constants";
import { Buffer } from "../../constants";
import { Helper } from "../../helper";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  const helper = new Helper();
  let contract: any; // eslint-disable-line

  const greeterContractAddress = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.greeterL2);

  const provider = new Provider(localConfig.L2Network);
  const wallet = new Wallet(Wallets.richWalletPrivateKey, provider);

  function getContract(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
    const artifact = hre.artifacts.readArtifactSync("Greeter");
    contract = new Contract(greeterContractAddress, artifact.abi, wallet);
    return contract;
  }

  const executeGreetings = getContract(hre, wallet);

  const newGreeting = "New Greetings!";
  const transaction = await executeGreetings.setGreeting(newGreeting);
  const transactionReceipt = await transaction.wait(1);

  console.log(`Transaction hash: ${transactionReceipt.transactionHash}`);

  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.executeGreeterTx, transactionReceipt.transactionHash);

  return transactionReceipt.transactionHash;
}
