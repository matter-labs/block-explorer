import * as ethers from "ethers";
import { promises as fs } from "fs";
import * as path from "path";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Buffer, Logger, Path, Wallets } from "../../../constants";
import { Helper } from "../../../helper";

export const transferEth = async function (sum = "0.000009", address: string = Wallets.mainWalletPrivateKey) {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
  const syncWallet2 = new zksync.Wallet(address, syncProvider, ethProvider);
  const bufferFile = path.join(Path.playbookRoot + Buffer.txEthTransfer);

  const transfer = await syncWallet.transfer({
    to: syncWallet2.address,
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther(sum),
  });

  const txHash = transfer.hash;
  await helper.logTransaction(Logger.transfer, txHash, "ETH");
  await fs.writeFile(bufferFile, txHash);

  return txHash;
};
