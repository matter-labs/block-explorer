import * as ethers from "ethers";
import * as zksync from "zksync-ethers";

import { localConfig } from "../../../config";
import { Buffer, Logger, Path, Wallets } from "../../../constants";
import { Helper } from "../../../helper";

const helper = new Helper();
const syncProvider = new zksync.Provider(localConfig.L2Network);
const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);

export const depositERC20 = async function (sum = "0.5", tokenAddress: string, units = 18) {
  const deposit = await syncWallet.deposit({
    to: Wallets.richWalletAddress,
    token: tokenAddress,
    amount: ethers.parseUnits(sum, units),
    approveERC20: true,
    l2GasLimit: localConfig.l2GasLimit,
    overrides: localConfig.l1GasLimit,
  });

  await deposit.wait(1);
  const txHash = deposit.hash;
  console.log("txHash --> ", txHash);
  const l2TokenAddress = await syncProvider.l2TokenAddress(tokenAddress);
  console.log("L2 token address ", l2TokenAddress);
  await deposit.waitFinalize();
  await helper.logTransaction(Logger.deposit, await txHash, "ERC20 token");
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.L2deposited, l2TokenAddress);
  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.txERC20Deposit, await txHash);

  return txHash;
};
