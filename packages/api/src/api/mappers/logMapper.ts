import { dateToTimestamp, numberToHex, parseIntToHex } from "../../common/utils";
import { Log } from "../../log/log.entity";

export const mapLogListItem = (log: Log) => {
  return {
    address: log.address,
    topics: log.topics,
    data: log.data,
    blockNumber: numberToHex(log.blockNumber),
    timeStamp: numberToHex(dateToTimestamp(log.timestamp)),
    gasPrice: parseIntToHex(log.transaction?.gasPrice),
    gasUsed: parseIntToHex(log.transaction?.transactionReceipt?.gasUsed),
    logIndex: numberToHex(log.logIndex),
    transactionHash: log.transactionHash,
    transactionIndex: numberToHex(log.transactionIndex),
  };
};
