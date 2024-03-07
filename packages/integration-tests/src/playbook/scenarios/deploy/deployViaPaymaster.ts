import { Buffer, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const deployViaPaymaster = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:paymaster`);

  const paymasterAddress = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymaster);
  const deployedToken = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.customToken);

  console.log("The custom token has been deployed via Paymaster: ", deployedToken);
  console.log("The Paymaster transaction: ", paymasterAddress);

  return [deployedToken, paymasterAddress];
};
