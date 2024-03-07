import { Buffer, Logger } from "../../../constants";
import { Helper } from "../../../helper";

let deployedContract: string;

export const deployGreeterToL2 = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook";
  const bufferFile = playbookRoot + "/" + Buffer.greeterL2;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:greeter`);

  deployedContract = await helper.getStringFromFile(bufferFile);
  console.log("The Greeter contract has been deployed to L2: ", Logger.textSeparator, deployedContract);

  return deployedContract;
};
