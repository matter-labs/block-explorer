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
const bufferAddressL2DepositedFile = playbookRoot + "/" + Buffer.L2deposited;
const bufferTxErc20DepositFile = playbookRoot + "/" + Buffer.txERC20Deposit;

export const depositERC20 = async function (sum = "0.5", tokenAddress: string, units = 18) {
  const deposit = await syncWallet.deposit({
    to: Wallets.richWalletAddress,
    token: tokenAddress,
    amount: ethers.utils.parseUnits(sum, units),
    approveERC20: true,
    l2GasLimit: localConfig.l2GasLimit,
    overrides: localConfig.gasLimit,
  });

  await deposit.wait(1);

  const l2TokenAddress = await syncProvider.l2TokenAddress(tokenAddress);
  console.log("L2 token address ", l2TokenAddress);
  const txHash = await deposit.waitFinalize();
  await helper.txHashLogger(Logger.deposit, txHash.transactionHash, "ERC20 token");
  await fs.writeFile(bufferAddressL2DepositedFile, l2TokenAddress);
  await fs.writeFile(bufferTxErc20DepositFile, txHash.transactionHash);

  return txHash;
};
