import * as ethers from "ethers";
import { Provider, Wallet } from "zksync-ethers";

import { localConfig } from "../../config";
import { Buffer, Path, Token, Wallets } from "../../constants";
import { Helper } from "../../helper";

import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function callMultiTransferETH(hre: HardhatRuntimeEnvironment) {
  const helper = new Helper();
  const contractName = "TokenF2L2"; // insert the name of the contract you want to deploy
  const contractAddress = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiTransferETH);

  //wallets, To
  const richWalletAddress = Wallets.richWalletAddress;
  const mainWalletAddress = Wallets.mainWalletAddress;
  const secondaryWalletAddress = Wallets.secondaryWalletAddress;
  // type of coin, contract
  const etherAddress = Token.addressETH; //ETH
  const customTokenI = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2);
  const customTokenII = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2deposited);
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
  const multiTransferResult = await makeMultiTransfer();

  async function makeTransfer(token: string, amount: ethers.BigNumberish) {
    const transfer = await wallet.transfer({
      to: contractAddress,
      token: token,
      amount,
      overrides: localConfig.l1GasLimit,
    });

    // await commitment
    const transferReceipt = await transfer.waitFinalize();
    console.log(`Tx transfer hash for ${token}: ${transferReceipt.transactionHash}`);

    return transferReceipt.transactionHash;
  }

  // TODO FIX
  //call the deployed contract.
  async function makeMultiTransfer() {
    const transferFromContract = await attachedContract.multiTransfer(
      [richWalletAddress, mainWalletAddress, secondaryWalletAddress],
      [etherAddress, customTokenI, customTokenII],
      [ethAmount, customTokenIAmount, customTokenIIAmount]
    );
    if (transferFromContract) {
      console.log(`Contract transfer to us!`);
      const transferReceipt = await transferFromContract.waitFinalize();
      console.log(`Contract transfer transaction hash: ${transferReceipt.transactionHash}`);
      return transferReceipt.transactionHash;
    } else {
      console.error(`Contract said something unexpected: ${transferFromContract}`);
    }
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
      await provider.getBalance(secondaryWalletAddress, "latest", customTokenII),
      18
    )}" Custom token II`
  );

  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCall, multiTransferResult);
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferETH, ethTransfer);
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCustomTokenI, customToken1Transfer);
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCustomTokenII, customToken2Transfer);
}
