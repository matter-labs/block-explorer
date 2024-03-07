import { promises as fs } from "fs";
import { ethers } from "hardhat";
import * as hardhatConfig from "hardhat";

import { Buffer, Wallets } from "../../constants";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

async function main() {
  const hre: HardhatRuntimeEnvironment = hardhatConfig;
  const MyNFTArtifact = await hre.artifacts.readArtifact("MyNFT");
  const [deployer] = await ethers.getSigners();
  const MyNFTFactory = new ethers.ContractFactory(MyNFTArtifact.abi, MyNFTArtifact.bytecode, deployer);

  const myNFT = await MyNFTFactory.deploy();
  console.log("Contract deployed to L1 address:", myNFT.address);

  const mintNFT = await myNFT.mintNFT(myNFT.address, Wallets.richWalletAddress);
  if (mintNFT) {
    console.log(`Contract mint for us!`);
  } else {
    console.error(`The NFT minting has been unsuccessful: ${mintNFT}`);
  }

  await fs.writeFile(Buffer.NFTtoL1, myNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
