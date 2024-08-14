import * as path from "path";

import { Logger } from "../../../entities";
import { Helper } from "../../../helper";

export const deployERC20toL2 = async function () {
  const helper = new Helper();
  const playbookRoot = path.join("src", "playbook");

  await helper.printLog(`Before contract compilation: deployERC20toL2`);
  await helper.executeScript(`npm --prefix ${playbookRoot} run compile`);

  await helper.printLog(`Before contract deployment: deployERC20toL2`);
  await helper.executeScript(`npm --prefix ${playbookRoot} run deployToL2`);
  // await helper.delay(5000);
  await helper.printLog(`Return to the initial script: deployERC20toL2`);
  const deployedToken = "0x0a691B9DC6C70CD946b5b170e9A781913ba40be7"; // await helper.getStringFromFile(bufferFile);

  await helper.printLog(`Before the latest PRINT in global`);
  await helper.printLog("The custom ERC20 token has been deployed to L2: " + Logger.textSeparator + deployedToken);
  await helper.printLog(`Before Return in global`);
  return deployedToken;
};
