import { Buffer } from "../../../constants";
import { Helper } from "../../../helper";

export const useGreeter = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook/";
  const txBuffer = playbookRoot + Buffer.executeGreeterTx;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:use:greeter`);

  const txGreeting = await helper.getStringFromFile(txBuffer);

  console.log("Execute the SetGreeting transaction: ", txGreeting);

  return txGreeting;
};
