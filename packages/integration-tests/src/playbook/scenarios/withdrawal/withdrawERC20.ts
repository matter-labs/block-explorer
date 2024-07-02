import * as ethers from "ethers";
import { promises as fs } from "fs";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Buffer, Logger, Wallets } from "../../../entities";
import { Helper } from "../../../helper";

export const withdrawERC20 = async function (tokenAddress: string, sum = "0.2") {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
  const bridges = await syncProvider.getDefaultBridgeAddresses();
  const playbookRoot = "src/playbook/";
  const bufferFile = playbookRoot + Buffer.txERC20Withdraw;

  const balance = await syncWallet.getBalance(tokenAddress);

  console.log(`Your balance is ${balance.toString()}`);

  const withdrawL2 = await syncWallet.withdraw({
    to: Wallets.richWalletAddress,
    amount: ethers.utils.parseEther(sum),
    token: tokenAddress,
    bridgeAddress: bridges.erc20L2,
    // overrides: localConfig.gasLimit,
  });

  const txHash = withdrawL2.hash;

  await withdrawL2.wait(1);
  await withdrawL2.waitFinalize();

  const balanceAfter = await syncWallet.getBalance(tokenAddress);

  console.log(`Your balance is ${balanceAfter.toString()}`);

  await helper.txHashLogger(Logger.withdraw, txHash, "Custom token");
  await fs.writeFile(bufferFile, txHash);

  return txHash;
};
