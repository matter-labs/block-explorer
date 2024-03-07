import { Buffer, Logger, Path } from "../../../constants";
import { Helper } from "../../../helper";

export const deployNFTtoL2 = async function () {
  const helper = new Helper();

  await helper.executeScript(`cd ${Path.playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${Path.playbookRoot} && npm run deployNFTtoL2`);

  const deployedNFT = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.NFTtoL2);
  console.log("The NFT has been deployed to L2: ", Logger.textSeparator, deployedNFT);

  return deployedNFT;
};
