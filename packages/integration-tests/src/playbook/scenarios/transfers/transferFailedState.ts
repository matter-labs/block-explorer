import * as ethers from "ethers";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Logger } from "../../../entities";
import { Helper } from "../../../helper";

export const transferFailedState = async function (tokenAddress: string, tokenName?: string) {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
  const amount = ethers.utils.parseEther("1.0");

  const transfer = await syncWallet.transfer({
    to: "0x0000000000000000000000000000000000000000",
    token: tokenAddress,
    amount,
    overrides: localConfig.gasLimit,
  });

  const txHash = transfer.hash;
  await helper.txHashLogger(Logger.txFailedState, txHash, tokenName);

  return txHash;
};
