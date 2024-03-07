import { Buffer, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const deployMultitransferETH = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deploy:multitransfer`);

  const multiTransferContractETH = await helper.readFile(
    Path.absolutePathToBufferFiles,
    Buffer.addressMultiTransferETH
  );

  console.log("The custom multitransfer contract ETH has been deployed to the address: ", multiTransferContractETH);

  return multiTransferContractETH;
};
