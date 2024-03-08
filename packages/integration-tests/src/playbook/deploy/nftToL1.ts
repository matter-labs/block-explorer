import { ethers } from "hardhat";
import * as hardhatConfig from "hardhat";

import { Buffer, Path, Wallets } from "../../constants";
import { Helper } from "../../helper";

import type { HardhatRuntimeEnvironment } from "hardhat/types";
const helper = new Helper();

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

  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.NFTtoL1, myNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
