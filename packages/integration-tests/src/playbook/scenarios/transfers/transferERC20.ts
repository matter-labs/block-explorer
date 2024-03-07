import * as ethers from "ethers";
import { promises as fs } from "fs";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Buffer, Logger, Wallets } from "../../../constants";
import { Helper } from "../../../helper";

export const transferERC20 = async function (sum: string, tokenAddress: string, tokenName?: string /*, units = 18*/) {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
  const syncWallet2 = new zksync.Wallet(Wallets.secondaryWalletPrivateKey, syncProvider, ethProvider);
  const playbookRoot = "src/playbook/";
  const bufferFile = playbookRoot + Buffer.txEthTransfer;

  const transfer = await syncWallet.transfer({
    to: syncWallet2.address,
    token: tokenAddress,
    amount: ethers.utils.parseEther(sum),
    overrides: localConfig.gasLimit,
  });

  const txHash = transfer.hash;
  await helper.txHashLogger(Logger.transfer, txHash, tokenName);
  await fs.writeFile(bufferFile, txHash);

  return txHash;
};
