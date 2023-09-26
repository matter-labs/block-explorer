import { Buffer } from "../../../entities";
import { Helper } from "../../../helper";
import { Playbook } from "../../playbook";

export const deployViaPaymaster = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook/";
  const bufferPaymaster = playbookRoot + Buffer.paymaster;
  const bufferCustomToken = playbookRoot + Buffer.paymaster;
  const bufferEmptyWallet = playbookRoot + Buffer.emptyWalletAddress;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:paymaster`);

  const paymasterAddress = await helper.getStringFromFile(bufferPaymaster);
  const deployedToken = await helper.getStringFromFile(bufferCustomToken);
  const emptyWallet = await helper.getStringFromFile(bufferEmptyWallet);

  console.log("The custom token has been deployed via Paymaster: ", deployedToken);
  console.log("The Paymaster transaction: ", paymasterAddress);

  return [deployedToken, paymasterAddress];
};
