import * as ethers from "ethers";
import * as zksync from "zksync-ethers";

import { localConfig } from "../../../config";
import { Buffer, Logger, Path, Wallets } from "../../../constants";
import { Helper } from "../../../helper";

export const withdrawERC20toOtherAddress = async function (tokenAddress: string, sum = "0.2") {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
  const bridges = await syncProvider.getDefaultBridgeAddresses();

  const balance = await syncWallet.getBalance(tokenAddress);

  console.log(`Your balance is ${balance.toString()}`);

  const withdrawL2 = await syncWallet.withdraw({
    to: Wallets.mainWalletAddress,
    amount: ethers.parseEther(sum),
    token: tokenAddress,
    bridgeAddress: bridges.erc20L2,
    overrides: localConfig.l1GasLimit,
  });

  const txHash = withdrawL2.hash;

  await withdrawL2.wait(1);
  await withdrawL2.waitFinalize();

  const balanceAfter = await syncWallet.getBalance(tokenAddress);

  console.log(`Your balance is ${balanceAfter.toString()}`);

  await helper.logTransaction(Logger.withdraw, txHash, "Custom token");
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txERC20WithdrawOtherAddress, txHash);

  return txHash;
};
