import * as ethers from "ethers";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Buffer, Logger, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const withdrawETH = async function (sum = "0.000009") {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);

  const withdrawL2 = await syncWallet.withdraw({
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther(sum),
  });

  const txHash = withdrawL2.hash;

  await withdrawL2.waitFinalize();
  await helper.logTransaction(Logger.withdraw, txHash, "ETH");
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txEthWithdraw, txHash);

  return txHash;
};
