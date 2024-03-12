import { Buffer, Logger, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const deployERC20toL1 = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deployToL1`);

  const deployedToken = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L1);
  console.log("The custom ERC20 token has been deployed to L1: ", Logger.textSeparator, deployedToken);

  return deployedToken;
};
