import * as ethers from "ethers";
import * as zksync from "zksync-ethers";

import { localConfig } from "../../../config";
import { Logger } from "../../../entities";
import { Helper } from "../../../helper";

export const depositEth = async function (sum = "0.000009") {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);

  const deposit = await syncWallet.deposit({
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.parseEther(sum),
    l2GasLimit: localConfig.l2GasLimit,
  });

  const txHash = deposit.hash;

  await deposit.waitL1Commit();
  await helper.txHashLogger(Logger.deposit, txHash, "ETH");

  return txHash;
};
