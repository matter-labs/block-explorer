import { Buffer, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const usePaymaster = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:use:paymaster`);

  const txPaymaster = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymasterTx);

  console.log("The Paymaster transaction: ", txPaymaster);

  return txPaymaster;
};
