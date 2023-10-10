import * as ethers from "ethers";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Logger, Wallets } from "../../../entities";
import { Helper } from "../../../helper";

export const transferERC20 = async function (sum: string, tokenAddress: string, tokenName?: string /*, units = 18*/) {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
  const syncWallet2 = new zksync.Wallet(Wallets.secondWalletPrivateKey, syncProvider, ethProvider);

  const transfer = await syncWallet.transfer({
    to: syncWallet2.address,
    token: tokenAddress,
    amount: ethers.utils.parseEther(sum),
    overrides: localConfig.gasLimit,
  });

  const txHash = transfer.hash;
  await helper.txHashLogger(Logger.transfer, txHash, tokenName);

  return txHash;
};
