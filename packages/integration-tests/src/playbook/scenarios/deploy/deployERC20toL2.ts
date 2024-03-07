import { Buffer, Logger } from "../../../constants";
import { Helper } from "../../../helper";

export const deployERC20toL2 = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook";
  const bufferFile = playbookRoot + "/" + Buffer.L2;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deployToL2`);

  const deployedToken = await helper.getStringFromFile(bufferFile);
  console.log("The custom ERC20 token has been deployed to L2: ", Logger.textSeparator, deployedToken);

  return deployedToken;
};
