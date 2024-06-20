import * as ethers from "ethers";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Buffer, Logger, Path, Values } from "../../../constants";
import { Helper } from "../../../helper";

export const depositEth = async function (sum: string = Values.txSumETH) {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);

  const deposit = await syncWallet.deposit({
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther(sum),
    l2GasLimit: localConfig.l2GasLimit,
  });
  await deposit.wait(1);
  const txHash = await deposit.waitFinalize();
  await helper.logTransaction(Logger.deposit, txHash.transactionHash, "ETH");
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txEthDeposit, txHash.transactionHash);

  return txHash;
};
