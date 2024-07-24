import { promises as fs } from "fs";
import { ethers } from "hardhat";
import * as hardhatConfig from "hardhat";

import { Buffer, Wallets } from "../../entities";

// import getWallet from "../utils/getWallet";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

async function main() {
  const hre: HardhatRuntimeEnvironment = hardhatConfig;
  const MyNFTArtifact = await hre.artifacts.readArtifact("MyNFT");
  const deployer = new ethers.Wallet(Wallets.richWalletPrivateKey, hre.ethers.provider);
  const MyNFTFactory = new ethers.ContractFactory(MyNFTArtifact.abi, MyNFTArtifact.bytecode, deployer);

  const myNFT = await MyNFTFactory.deploy();
  const address = await myNFT.getAddress();
  console.log("Contract deployed to L1 address:", address);

  // TODO: ProviderError: nonce too high
  // const mintNFT = await myNFT.mintNFT(address, Wallets.richWalletAddress);
  // if (mintNFT) {
  //   console.log(`Contract mint for us!`);
  // } else {
  //   console.error(`The NFT minting has been unsuccessful: ${mintNFT}`);
  // }

  await fs.writeFile(Buffer.NFTtoL1, address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
