import { Buffer } from "../../../constants";
import { Helper } from "../../../helper";

export const deployMultitransferETH = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook";
  const bufferFile = playbookRoot + "/" + Buffer.addressMultiTransferETH;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deploy:multitransfer`);

  const multiTransferContractETH = await helper.getStringFromFile(bufferFile);

  console.log("The custom multitransfer contract ETH has been deployed to the address: ", multiTransferContractETH);

  return multiTransferContractETH;
};
