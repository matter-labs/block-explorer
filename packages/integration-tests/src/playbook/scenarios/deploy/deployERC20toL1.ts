import { Buffer, Logger } from "../../../constants";
import { Helper } from "../../../helper";

export const deployERC20toL1 = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook";
  const bufferFile = playbookRoot + "/" + Buffer.L1;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deployToL1`);

  const deployedToken = await helper.getStringFromFile(bufferFile);
  console.log("The custom ERC20 token has been deployed to L1: ", Logger.textSeparator, deployedToken);

  return deployedToken;
};
