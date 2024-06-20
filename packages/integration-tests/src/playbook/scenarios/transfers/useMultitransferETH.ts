import { Buffer, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const useMultitransferETH = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:use:multitransfer`);

  const txMultiTransferETH = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferETH);
  const txMultiTransferCustomTokenI = await helper.readFile(
    Path.absolutePathToBufferFiles,
    Buffer.txMultiTransferCustomTokenI
  );
  const txMultiTransferCustomTokenII = await helper.readFile(
    Path.absolutePathToBufferFiles,
    Buffer.txMultiTransferCustomTokenII
  );

  console.log("The multi transfer transaction for ETH: ", txMultiTransferETH);
  console.log("The multi transfer transaction for the Custom token I: ", txMultiTransferCustomTokenI);
  console.log("The multi transfer transaction for the Custom token II: ", txMultiTransferCustomTokenII);

  return [txMultiTransferETH, txMultiTransferCustomTokenI, txMultiTransferCustomTokenII];
};
