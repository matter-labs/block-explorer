import { Buffer, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const deployMulticallContracts = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:multicall:root`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:multicall:middle`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:multicall:caller`);

  const multiCallRoot = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiCallRoot);
  const multiCallMiddle = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiCallMiddle);
  const multiCallCaller = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiCallCaller);

  console.log(
    "Multicall contracts (Root, Middle and Caller) have been deployed to the address: ",
    multiCallRoot,
    multiCallMiddle,
    multiCallCaller
  );

  return [multiCallRoot, multiCallMiddle, multiCallCaller];
};
