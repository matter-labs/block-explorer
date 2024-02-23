import * as ethers from "ethers";
import { promises as fs } from "fs";
import * as zksync from "zksync-web3";

import { localConfig } from "../../../config";
import { Buffer, Logger } from "../../../entities";
import { Helper } from "../../../helper";

export const depositEth = async function (sum = "0.000009") {
  const helper = new Helper();
  const syncProvider = new zksync.Provider(localConfig.L2Network);
  const ethProvider = ethers.getDefaultProvider(localConfig.L1Network);
  const syncWallet = new zksync.Wallet(localConfig.privateKey, syncProvider, ethProvider);
  const playbookRoot = "src/playbook/";
  const bufferFile = playbookRoot + Buffer.txEthDeposit;

  const deposit = await syncWallet.deposit({
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther(sum),
    l2GasLimit: localConfig.l2GasLimit,
  });
  await deposit.wait(1);
  const txHash = await deposit.waitFinalize();
  await helper.txHashLogger(Logger.deposit, txHash.transactionHash, "ETH");
  await fs.writeFile(bufferFile, txHash.transactionHash);

  return txHash;
};
