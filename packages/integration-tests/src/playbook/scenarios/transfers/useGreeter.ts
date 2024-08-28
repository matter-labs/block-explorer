import { Buffer, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const useGreeter = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:use:greeter`);

  const txGreeting = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.executeGreeterTx);

  console.log("Execute the SetGreeting transaction: ", txGreeting);

  return txGreeting;
};
