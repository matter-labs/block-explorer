import * as ethers from "ethers";
import * as zksync from "zksync-ethers";

import { localConfig } from "../../../config";
import { Buffer, Logger, Path, Values, Wallets } from "../../../constants";
import { Helper } from "../../../helper";

export const withdrawETHtoOtherAddress = async function (sum: string = Values.txSumETH) {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);

  const withdrawL2 = await syncWallet.withdraw({
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.parseEther(sum),
    to: Wallets.mainWalletAddress,
  });

  const txHash = withdrawL2.hash;

  await withdrawL2.waitFinalize();
  await helper.logTransaction(Logger.withdraw, txHash, "ETH");
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txEthWithdrawOtherAddress, txHash);

  return txHash;
};
