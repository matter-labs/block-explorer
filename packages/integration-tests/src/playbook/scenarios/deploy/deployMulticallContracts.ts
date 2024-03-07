import { Buffer } from "../../../constants";
import { Helper } from "../../../helper";

export const deployMulticallContracts = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook";
  const bufferFileRoot = playbookRoot + "/" + Buffer.addressMultiCallRoot;
  const bufferFileMiddle = playbookRoot + "/" + Buffer.addressMultiCallMiddle;
  const bufferFileCaller = playbookRoot + "/" + Buffer.addressMultiCallCaller;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:multicall:root`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:multicall:middle`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:multicall:caller`);

  const multiCallRoot = await helper.getStringFromFile(bufferFileRoot);
  const multiCallMiddle = await helper.getStringFromFile(bufferFileMiddle);
  const multiCallCaller = await helper.getStringFromFile(bufferFileCaller);

  console.log(
    "Multicall contracts (Root, Middle and Caller) have been deployed to the address: ",
    multiCallRoot,
    multiCallMiddle,
    multiCallCaller
  );

  return [multiCallRoot, multiCallMiddle, multiCallCaller];
};
