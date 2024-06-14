import { ethers } from "hardhat";

import { localConfig } from "../../config";
import { Buffer, Path, Wallets } from "../../constants";
import { Helper } from "../../helper";

const helper = new Helper();
async function main() {
  // TODO: fix
  // const [deployer] = await ethers.getSigners();
  // console.log("Deploying contracts with the account:", deployer.address);
  // const weiAmount = (await deployer.getBalance()).toString();
  // console.log("Account balance:", await ethers.utils.formatEther(weiAmount));
  // const contract = await ethers.getContractFactory("L1");
  // const token = await contract.deploy(Wallets.richWalletAddress, localConfig.l1GasLimit);
  // const contractAddress = await token.getAddress();
  // await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.L1, contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
