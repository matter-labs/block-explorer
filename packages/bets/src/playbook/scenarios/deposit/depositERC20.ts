import * as ethers from "ethers";
import { promises as fs } from "fs";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Buffer, Logger, Wallets } from "../../../entities";
import { Helper } from "../../../helper";

const helper = new Helper();
const syncProvider = new zksync.Provider(localConfig.L2Network);
const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
const playbookRoot = "src/playbook";
const bufferFile = playbookRoot + "/" + Buffer.L2deposited;

export const depositERC20 = async function (sum = "0.5", tokenAddress: string, units = 18) {
  const deposit = await syncWallet.deposit({
    to: Wallets.richWalletAddress,
    token: tokenAddress,
    amount: ethers.utils.parseUnits(sum, units),
    approveERC20: true,
    l2GasLimit: localConfig.l2GasLimit,
    overrides: localConfig.gasLimit,
  });

  const txHash = deposit.hash;

  await deposit.wait(1);
  await deposit.waitL1Commit(1);

  const l2TokenAddress = await syncProvider.l2TokenAddress(tokenAddress);
  console.log("L2 token address ", l2TokenAddress);
  await fs.writeFile(bufferFile, l2TokenAddress);
  await helper.txHashLogger(Logger.deposit, txHash, "ERC20 token");

  return txHash;
};
