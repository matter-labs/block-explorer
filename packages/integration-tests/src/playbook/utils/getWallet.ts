import * as eth from "ethers";
import { Provider, Wallet } from "zksync-ethers";

import { Wallets } from "../../entities";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function (hre: any) {
  const syncProvider = new Provider(hre.config.networks.zkSyncLocal.url);
  const ethProvider = new Provider(hre.config.networks.zkSyncLocal.ethNetwork);
  const walletPrivateKey = process.env.WALLET_PRIVATE_KEY || Wallets.richWalletPrivateKey;

  // Initialize the wallet.
  const wallet = new Wallet(walletPrivateKey as string, syncProvider, ethProvider);
  console.log(`Deploying using wallet: ${wallet.address}`);

  // Wallet ETH balance
  const ethBalance = await wallet.getBalance();
  const ethBalanceL1 = await wallet.getBalanceL1();
  console.log(`Wallet ETH L1 balance: ${eth.formatUnits(ethBalanceL1)} ETH\n`);
  console.log(`Wallet ETH L2 balance: ${eth.formatUnits(ethBalance)} ETH\n`);

  return wallet;
}
