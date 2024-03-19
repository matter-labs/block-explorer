import * as ethers from "ethers";
import { Provider, utils, Wallet } from "zksync-web3";

import { localConfig } from "../../config";
import { Buffer, Path } from "../../constants";
import { Helper } from "../../helper";

import type { HardhatRuntimeEnvironment } from "hardhat/types";
const helper = new Helper();

export default async function (hre: HardhatRuntimeEnvironment) {
  const PAYMASTER_ADDRESS = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymaster);
  const TOKEN_ADDRESS = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.customToken);
  const EMPTY_WALLET_PRIVATE_KEY = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.emptyWalletPrivateKey);

  const provider = new Provider(localConfig.L2Network);
  const emptyWallet = new Wallet(EMPTY_WALLET_PRIVATE_KEY, provider);

  function getToken(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
    const artifact = hre.artifacts.readArtifactSync("MyERC20");
    return new ethers.Contract(TOKEN_ADDRESS, artifact.abi, wallet);
  }

  const ethBalance = await emptyWallet.getBalance();
  if (!ethBalance.eq(0)) {
    throw new Error("The wallet is not empty");
  }

  console.log(`Balance of the user before mint: ${await emptyWallet.getBalance(TOKEN_ADDRESS)}`);

  const erc20 = getToken(hre, emptyWallet);

  const gasPrice = await provider.getGasPrice();

  const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: "ApprovalBased",
    token: TOKEN_ADDRESS,
    minimalAllowance: ethers.BigNumber.from(1),
    innerInput: new Uint8Array(),
  });

  const gasLimit = await erc20.estimateGas.mint(emptyWallet.address, 100, {
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: paymasterParams,
    },
  });

  gasPrice.mul(gasLimit.toString());

  const mintTx = await erc20.mint(emptyWallet.address, 90, {
    customData: {
      paymasterParams: paymasterParams,
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    },
  });

  const receipt = await mintTx.wait();

  console.log(`Balance of the user after mint: ${await emptyWallet.getBalance(TOKEN_ADDRESS)}`);

  console.log(`Balance of the user after mint: ${await emptyWallet.getBalance(TOKEN_ADDRESS)}`);

  await helper.writeFile(Path.absolutePathToBufferFiles, Buffer.paymasterTx, receipt.transactionHash);
  console.log(`Transaction hash: ${receipt.transactionHash}`);

  return receipt.transactionHash;
}