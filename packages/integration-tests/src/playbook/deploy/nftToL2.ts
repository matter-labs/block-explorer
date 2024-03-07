import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { promises as fs } from "fs";

import { Buffer, Wallets } from "../../entities";
import displayVerificationInfo from "../utils/displayVerificationInfo";
import getWallet from "../utils/getWallet";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the Greeter contract`);

  const wallet = await getWallet(hre);
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("MyNFT");
  const contractConstructorArguments = [];

  console.log(`Arguments for the contract constructor: ${JSON.stringify(contractConstructorArguments)}`);

  const myNFT = await deployer.deploy(artifact, contractConstructorArguments);

  console.log(`Contract "${artifact.contractName}" was deployed to ${myNFT.address}`);

  const mintNFT = await myNFT.mintNFT(myNFT.address, Wallets.richWalletAddress);
  if (mintNFT) {
    console.log(`Contract mint for us!`);
  } else {
    console.error(`Contract said something unexpected: ${mintNFT}`);
  }

  displayVerificationInfo({ hre, contract: myNFT, contractConstructorArguments, artifact });

  await fs.writeFile(Buffer.NFTtoL2, myNFT.address);
}
