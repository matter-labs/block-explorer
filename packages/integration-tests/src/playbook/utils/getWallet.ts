import { getDefaultProvider, utils } from "ethers";
import { Provider, Wallet } from "zksync-web3";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function (hre: any) {
  const syncProvider = new Provider(hre.config.networks.zkSyncLocal.url);
  const ethProvider = getDefaultProvider(hre.config.networks.zkSyncLocal.ethNetwork);

  if (!process.env.WALLET_PRIVATE_KEY) {
    throw new Error("WALLET_PRIVATE_KEY env variable is not set");
  }

  // Initialize the wallet.
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY as string, syncProvider, ethProvider);
  console.log(`Deploying using wallet: ${wallet.address}`);

  // Wallet ETH balance
  const ethBalance = await wallet.getBalance();
  console.log(`Wallet ETH balance: ${utils.formatUnits(ethBalance)} ETH\n`);

  return wallet;
}
