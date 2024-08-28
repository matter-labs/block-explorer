import { Buffer, Logger, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const deployNFTtoL1 = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deployNFTtoL1`);

  const deployedNFT = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.NFTtoL1);
  console.log("The NFT has been deployed to L1: ", Logger.textSeparator, deployedNFT);

  return deployedNFT;
};
