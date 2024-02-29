import * as ethers from "ethers";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { CustomValue, Logger } from "../../../entities";
import { Helper } from "../../../helper";

export const depositEth = async function (sum = CustomValue.txSumEth) {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);

  const deposit = await syncWallet.deposit({
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther(sum),
    l2GasLimit: localConfig.l2GasLimit,
  });

  const txHash = deposit.hash;

  await deposit.wait(1);
  await helper.txHashLogger(Logger.deposit, txHash, "ETH");

  return txHash;
};
