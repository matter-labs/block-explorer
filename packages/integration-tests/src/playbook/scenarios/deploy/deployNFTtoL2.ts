import { Buffer, Logger } from "../../../constants";
import { Helper } from "../../../helper";

export const deployNFTtoL2 = async function () {
  const helper = new Helper();
  const playbookRoot = "src/playbook";
  const bufferFile = playbookRoot + "/" + Buffer.NFTtoL2;

  await helper.executeScript(`cd ${playbookRoot} && npm run compile`);
  await helper.executeScript(`cd ${playbookRoot} && npm run deployNFTtoL2`);

  const deployedNFT = await helper.getStringFromFile(bufferFile);
  console.log("The NFT has been deployed to L2: ", Logger.textSeparator, deployedNFT);

  return deployedNFT;
};
