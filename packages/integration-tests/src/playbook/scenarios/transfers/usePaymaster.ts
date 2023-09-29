import { Buffer } from "../../../entities";
import { Helper } from "../../../helper";

export const usePaymaster = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook/";
  const txBuffer = playbookRoot + Buffer.paymasterTx;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:use:paymaster`);

  const txPaymaster = await helper.getStringFromFile(txBuffer);

  console.log("The Paymaster transaction: ", txPaymaster);

  return txPaymaster;
};
