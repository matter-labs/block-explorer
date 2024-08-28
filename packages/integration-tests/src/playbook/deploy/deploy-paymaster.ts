import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { parseEther } from "ethers";
import { promises as fs } from "fs";
import { Wallet } from "zksync-ethers";

import { Buffer, Wallets } from "../../entities";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = new Wallet(Wallets.richWalletPrivateKey);
  // The wallet that will receive ERC20 tokens
  const emptyWallet = Wallet.createRandom();
  console.log(`Empty wallet's address: ${emptyWallet.address}`);
  await fs.writeFile(Buffer.emptyWalletAddress, emptyWallet.address);
  console.log(`Empty wallet's private key: ${emptyWallet.privateKey}`);
  await fs.writeFile(Buffer.emptyWalletPrivateKey, emptyWallet.privateKey);

  const deployer = new Deployer(hre, wallet);

  // Deploying the ERC20 token
  const erc20Artifact = await deployer.loadArtifact("MyERC20");
  const erc20 = await deployer.deploy(erc20Artifact, ["MyToken", "MyToken", 18]);
  const erc20Address = await erc20.getAddress();
  console.log(`ERC20 address: ${erc20Address}`);
  await fs.writeFile(Buffer.customToken, erc20Address);

  const paymasterArtifact = await deployer.loadArtifact("MyPaymaster");
  const paymaster = await deployer.deploy(paymasterArtifact, [erc20Address]);
  const paymasterAddress = await paymaster.getAddress();
  console.log(`Paymaster address: ${paymasterAddress}`);
  await fs.writeFile(Buffer.paymaster, paymasterAddress);

  const deployTransaction = await paymaster.deploymentTransaction();
  console.log(`Paymaster deploy transaction: ${deployTransaction.hash}`);
  await fs.writeFile(Buffer.paymasterDeployTx, deployTransaction.hash);

  await (
    await deployer.zkWallet.sendTransaction({
      to: paymasterAddress,
      value: parseEther("0.03"),
    })
  ).wait();

  await // We will give the empty wallet 3 units of the token:
  (await erc20.mint(emptyWallet.address, 3)).wait();

  console.log("Minted 3 tokens for the empty wallet");
  console.log(`Done!`);

  return deployTransaction.hash;
}
