import { Buffer, Logger } from "../../../entities";
import { Helper } from "../../../helper";

export const deployERC20toL1 = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook";
  const bufferFile = playbookRoot + "/" + Buffer.L1;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.delay(1500);
  await helper.executeScript(`cd ${playbookRoot} && npm run deployToL1`);
  await helper.delay(1500);
  const deployedToken = await helper.getStringFromFile(bufferFile);
  console.log("The custom ERC20 token has been deployed to L1: ", Logger.textSeparator, deployedToken);

  return deployedToken;
};
