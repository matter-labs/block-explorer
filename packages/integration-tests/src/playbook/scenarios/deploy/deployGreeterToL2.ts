import { Buffer, Logger, Path } from "../../../constants";
import { Helper } from "../../../helper";

let deployedContract: string;

export const deployGreeterToL2 = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:greeter`);

  deployedContract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.greeterL2);
  console.log("The Greeter contract has been deployed to L2: ", Logger.textSeparator, deployedContract);

  return deployedContract;
};
