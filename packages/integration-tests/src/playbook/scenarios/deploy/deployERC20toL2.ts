import * as path from "path";

import { Buffer, Logger } from "../../../entities";
import { Helper } from "../../../helper";

export const deployERC20toL2 = async function () {
  const helper = new Helper();
  const playbookRoot = path.join("src", "playbook");
  const bufferFile = path.join(playbookRoot, Buffer.L2);
  await helper.printLog(bufferFile);
  await helper.executeScript(`cat ${bufferFile}`);

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deployToL2`);
  await helper.printLog(`Return to the initial script: deployERC20toL2`);
  const deployedToken = await helper.getStringFromFile(bufferFile);
  await helper.printLog(`Before the latest PRINT in global`);
  await helper.printLog("The custom ERC20 token has been deployed to L2: " + Logger.textSeparator + deployedToken);
  await helper.printLog(`Before Return in global`);
  return deployedToken;
};
