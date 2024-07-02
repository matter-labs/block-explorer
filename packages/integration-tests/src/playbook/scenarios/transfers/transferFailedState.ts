import * as ethers from "ethers";
import * as zksync from "zksync-ethers";

import { localConfig } from "../../../config";
import { Buffer, Logger, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const transferFailedState = async function (tokenAddress: string, tokenName?: string) {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
  const amount = ethers.parseEther("1.0");

  const transfer = await syncWallet.transfer({
    to: "0x0000000000000000000000000000000000000000",
    token: tokenAddress,
    amount,
    overrides: localConfig.l1GasLimit,
  });

  const txHash = transfer.hash;
  await helper.logTransaction(Logger.txFailedState, txHash, tokenName);
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.failedState, txHash);

  return txHash;
};
