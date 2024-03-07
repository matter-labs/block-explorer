import { Buffer } from "../../../constants";
import { Helper } from "../../../helper";

export const useMultiCallContracts = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook/";
  const txBufferUseMultiCall = playbookRoot + Buffer.txUseMultiCallContracts;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:use:multicall`);

  const txUseMultiCallContracts = await helper.getStringFromFile(txBufferUseMultiCall);

  return txUseMultiCallContracts;
};
