import { Buffer } from "../../../constants";
import { Helper } from "../../../helper";

export const useMultitransferETH = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook/";
  const txBufferETH = playbookRoot + Buffer.txMultiTransferETH;
  const txBufferCustomTokenI = playbookRoot + Buffer.txMultiTransferCustomTokenI;
  const txBufferCustomTokenII = playbookRoot + Buffer.txMultiTransferCustomTokenII;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:use:multitransfer`);

  const txMultiTransferETH = await helper.getStringFromFile(txBufferETH);
  const txMultiTransferCustomTokenI = await helper.getStringFromFile(txBufferCustomTokenI);
  const txMultiTransferCustomTokenII = await helper.getStringFromFile(txBufferCustomTokenII);

  console.log("The multi transfer transaction for ETH: ", txMultiTransferETH);
  console.log("The multi transfer transaction for the Custom token I: ", txMultiTransferCustomTokenI);
  console.log("The multi transfer transaction for the Custom token II: ", txMultiTransferCustomTokenII);

  return [txMultiTransferETH, txMultiTransferCustomTokenI, txMultiTransferCustomTokenII];
};
