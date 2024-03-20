import { Buffer, Logger, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const deployERC20toL2 = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deployToL2`);

  const deployedToken = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2);
  console.log("The custom ERC20 token has been deployed to L2: ", Logger.textSeparator, deployedToken);

  return deployedToken;
};
