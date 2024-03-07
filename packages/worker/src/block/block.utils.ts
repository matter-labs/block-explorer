import { BlockInfo } from "./block.watcher";

export const validateBlocksLinking = (blockInfoList: BlockInfo[]) => {
  const isLinkingValid = !blockInfoList.find(
    (blockInfo, index) => blockInfoList[index + 1] && blockInfo.block.hash !== blockInfoList[index + 1].block.parentHash
  );
  return isLinkingValid;
};
