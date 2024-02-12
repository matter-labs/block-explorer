import { utils } from "ethers";
import { types } from "zksync-web3";
import logger from "../logger";

const ADDRESS_LENGTH = 40;

export default function parseLog(
  contractInterface: { interface: utils.Interface },
  log: types.Log
): utils.LogDescription {
  const logDescription = contractInterface.interface.parseLog(log);

  // All the logic below is to handle specific solc versions issue causing args of type address to be out of range sometimes
  if (logDescription.eventFragment?.type !== "event" || !logDescription.eventFragment.inputs?.length) {
    return logDescription;
  }

  let hasAddressOutOfRangeErrors = false;
  const topics = [...log.topics];

  Object.keys(logDescription.args).forEach((arg) => {
    try {
      // accessing property to throw deferred error if any
      logDescription.args[arg];
    } catch (error) {
      logger.error("Failed to parse log argument", {
        error,
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        transactionHash: log.transactionHash,
        arg,
      });
      if (!error.error) {
        return;
      }
      if (error.error.reason !== "value out of range" || error.error.type !== "address") {
        return;
      }
      const inputIndex = logDescription.eventFragment.inputs.findIndex((input) => input.name === error.error.name);
      if (inputIndex === -1) {
        return;
      }
      const input = logDescription.eventFragment.inputs[inputIndex];
      if (!input.indexed) {
        return;
      }
      // incrementing inputIndex to get topicIndex as the first topic is event signature
      const topicIndex = inputIndex + 1;
      if (!topics[topicIndex]) {
        return;
      }
      topics[topicIndex] = `0x000000000000000000000000${topics[topicIndex].slice(-ADDRESS_LENGTH)}`;
      hasAddressOutOfRangeErrors = true;
    }
  });

  return hasAddressOutOfRangeErrors
    ? contractInterface.interface.parseLog({
        ...log,
        topics,
      })
    : logDescription;
}
