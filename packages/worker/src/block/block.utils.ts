import { BlockData } from "../dataFetcher/types";

export const validateBlocksLinking = (blockInfoList: BlockData[]) => {
  const isLinkingValid = !blockInfoList.find(
    (blockInfo, index) => blockInfoList[index + 1] && blockInfo.block.hash !== blockInfoList[index + 1].block.parentHash
  );
  return isLinkingValid;
};
