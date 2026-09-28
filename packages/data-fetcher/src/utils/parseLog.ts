import { LogDescription, Interface, Log } from "ethers";
import logger from "../logger";

const ADDRESS_LENGTH = 40;

export default function parseLog(contractInterface: { interface: Interface }, log: Log): LogDescription {
  let logDescription: LogDescription;
  try {
    logDescription = contractInterface.interface.parseLog(log);
  } catch (error) {
    logger.warn("Failed to parse log", {
      error,
      blockNumber: log.blockNumber,
      logIndex: log.index,
      transactionHash: log.transactionHash,
    });
    return;
  }
  if (!logDescription) {
    return;
  }
  // All the logic below is to handle specific solc versions issue causing args of type address to be out of range sometimes
  if (logDescription.fragment?.type !== "event" || !logDescription.fragment.inputs?.length) {
    return logDescription;
  }

  let hasAddressOutOfRangeErrors = false;
  const topics = [...log.topics];
  let data = log.data;
  Object.keys(logDescription.args).forEach((arg) => {
    try {
      // accessing property to throw deferred error if any
      logDescription.args[arg];
    } catch (error) {
      logger.error("Failed to parse log argument", {
        error,
        blockNumber: log.blockNumber,
        logIndex: log.index,
        transactionHash: log.transactionHash,
        arg,
      });
      if (!error.error?.error) {
        return;
      }
      const { code, fault, type } = error.error.error;
      if (code !== "NUMERIC_FAULT" || fault !== "overflow" || type !== "address") {
        return;
      }
      const inputIndex = Number(arg);
      const input = logDescription.fragment.inputs[inputIndex];
      if (!input.indexed) {
        // non-indexed args are encoded in data, arg word is located only if all preceding non-indexed args take one word
        const precedingInputs = logDescription.fragment.inputs.slice(0, inputIndex).filter(({ indexed }) => !indexed);
        if (precedingInputs.some(({ baseType }) => baseType === "tuple" || baseType === "array")) {
          return;
        }
        const dataIndex = 2 + precedingInputs.length * 64;
        data = `${data.slice(0, dataIndex)}000000000000000000000000${data.slice(dataIndex + 24)}`;
        hasAddressOutOfRangeErrors = true;
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
        data,
      })
    : logDescription;
}
