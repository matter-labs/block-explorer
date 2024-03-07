import { Buffer, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const useMultiCallContracts = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:use:multicall`);

  const txUseMultiCallContracts = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txUseMultiCallContracts);

  return txUseMultiCallContracts;
};
