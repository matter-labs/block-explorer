import * as ethers from "ethers";
import { promises as fs } from "fs";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Buffer, Logger, Wallets } from "../../../constants";
import { Helper } from "../../../helper";

export const withdrawETHtoOtherAddress = async function (sum = "0.000009") {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
  const playbookRoot = "src/playbook/";
  const bufferFile = playbookRoot + Buffer.txEthWithdrawOtherAddress;

  const withdrawL2 = await syncWallet.withdraw({
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther(sum),
    to: Wallets.mainWalletAddress,
  });

  const txHash = withdrawL2.hash;

  await withdrawL2.waitFinalize();
  await helper.logTransaction(Logger.withdraw, txHash, "ETH");
  await fs.writeFile(bufferFile, txHash);

  return txHash;
};
