import * as ethers from "ethers";
import { promises as fs } from "fs";
import { Provider, Wallet } from "zksync-ethers";

import { localConfig } from "../../config";
import { Buffer, Token, Wallets } from "../../entities";
import { Helper } from "../../helper";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function callMultiTransferETH(hre: HardhatRuntimeEnvironment) {
  const helper = new Helper();
  const playbookRoot = "src/playbook/";
  const firstToken = playbookRoot + Buffer.L2;
  const secondToken = playbookRoot + Buffer.L2deposited;
  const buffer = playbookRoot + Buffer.addressMultiTransferETH;
  const contractName = "TokenF2L2"; // insert the name of the contract you want to deploy
  const contractAddress = await helper.getStringFromFile(buffer);

  //wallets, To
  const richWalletAddress = Wallets.richWalletAddress;
  const mainWalletAddress = Wallets.mainWalletAddress;
  const secondWalletAddress = Wallets.secondWalletAddress;
  // type of coin, contract
  const etherAddress = Token.ETHER_Address; //ETH
  const customTokenI = await helper.getStringFromFile(firstToken);
  const customTokenII = await helper.getStringFromFile(secondToken);
  // amount of funds
  const ethAmount = ethers.parseEther("0.0001");
  const customTokenIAmount = ethers.parseUnits("0.01", 18);
  const customTokenIIAmount = ethers.parseUnits("0.01", 18);

  console.log(`Running deploy script for the contract`);

  //get an access to contract
  const provider = new Provider(localConfig.L2Network);
  const wallet = new Wallet(Wallets.richWalletPrivateKey, provider);
  const signer = wallet.connect(provider);
  const attachedContract = await hre.ethers.getContractAt(contractName, contractAddress, signer);

  // top up the contract / transfer
  const ethTransfer = await makeTransfer(etherAddress, ethers.parseEther("0.101"));
  const customToken1Transfer = await makeTransfer(customTokenI, ethers.parseUnits("1", 18));
  const customToken2Transfer = await makeTransfer(customTokenII, ethers.parseUnits("1", 18));

  async function makeTransfer(token: string, amount: ethers.BigNumberish) {
    const transfer = await wallet.transfer({
      to: contractAddress,
      token: token,
      amount,
      overrides: localConfig.gasLimit,
    });

    // await commitment
    const transferReceipt = await transfer.wait(1);
    console.log(`Tx transfer hash for ${token}: ${transferReceipt.hash}`);

    return transferReceipt.hash;
  }

  //call the deployed contract.
  const transferFromContract = await attachedContract.multiTransfer(
    [richWalletAddress, mainWalletAddress, secondWalletAddress],
    [etherAddress, customTokenI, customTokenII],
    [ethAmount, customTokenIAmount, customTokenIIAmount]
  );
  if (transferFromContract) {
    console.log(`Contract transfer to us!`);
  } else {
    console.error(`Contract said something unexpected: ${transferFromContract}`);
  }

  // Show the contract balance
  console.log(
    `Getting ETH balance from contract API: "${ethers.formatUnits(await provider.getBalance(contractAddress), 18)}"`
  );

  // Show the balance of wallets
  console.log(`balance of wallet 1 is: "${ethers.formatUnits(await provider.getBalance(richWalletAddress), 18)}" ETH`);
  console.log(
    `balance of wallet 2 is: "${ethers.formatUnits(
      await provider.getBalance(mainWalletAddress, "latest", customTokenI),
      18
    )}" Custom token I`
  );
  console.log(
    `balance of wallet 3 is: "${ethers.formatUnits(
      await provider.getBalance(secondWalletAddress, "latest", customTokenII),
      18
    )}" Custom token II`
  );

  await fs.writeFile(Buffer.txMultiTransferETH, ethTransfer);
  await fs.writeFile(Buffer.txMultiTransferCustomTokenI, customToken1Transfer);
  await fs.writeFile(Buffer.txMultiTransferCustomTokenII, customToken2Transfer);
}
