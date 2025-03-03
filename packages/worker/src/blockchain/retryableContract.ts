import { Logger } from "@nestjs/common";
import { setTimeout } from "timers/promises";
import { Contract, Interface, ContractRunner, ErrorCode, isError } from "ethers";

interface EthersError {
  code: ErrorCode | number;
  shortMessage: string;
}

const MAX_RETRY_INTERVAL = 60000;

const PERMANENT_ERRORS: ErrorCode[] = [
  "INVALID_ARGUMENT",
  "MISSING_ARGUMENT",
  "UNEXPECTED_ARGUMENT",
  "NOT_IMPLEMENTED",
];

const shouldRetry = (error: EthersError): boolean => {
  const isPermanentErrorCode = PERMANENT_ERRORS.find((errorCode) => isError(error, errorCode));
  return (
    !isPermanentErrorCode &&
    // example block mainnet 47752810
    !(error.code === 3 && error.shortMessage?.startsWith("execution reverted")) &&
    // example block mainnet 47819836
    !(error.code === "BAD_DATA" && error.shortMessage?.startsWith("could not decode result data"))
  );
};

const retryableFunctionCall = async (
  result: Promise<any>,
  functionCall: () => any,
  logger: Logger,
  functionName: string,
  addressOrName: string,
  retryTimeout: number
): Promise<any> => {
  try {
    return await result;
  } catch (error) {
    const isRetryable = shouldRetry(error);
    logger.warn({
      message: `Requested contract function ${functionName} failed to execute, ${
        isRetryable ? "retrying..." : "not retryable"
      }`,
      contractAddress: addressOrName,
      error,
    });
    if (!isRetryable) {
      throw error;
    }
  }
  await setTimeout(retryTimeout);

  const nextRetryTimeout = Math.min(retryTimeout * 2, MAX_RETRY_INTERVAL);
  return retryableFunctionCall(functionCall(), functionCall, logger, functionName, addressOrName, nextRetryTimeout);
};

const getProxyHandler = (addressOrName: string, logger: Logger, retryTimeout: number) => {
  return {
    get: function (target, propertyKey, receiver) {
      if (target.contract[propertyKey] instanceof Function) {
        return function (...args) {
          const result = target.contract[propertyKey].apply(this, args);
          if (result instanceof Promise) {
            return retryableFunctionCall(
              result,
              () => target.contract[propertyKey].apply(this, args),
              logger,
              propertyKey,
              addressOrName,
              retryTimeout
            );
          }
          return result;
        };
      }
      return Reflect.get(target.contract, propertyKey, receiver);
    },
  };
};

export class RetryableContract extends Contract {
  constructor(
    addressOrName: string,
    contractInterface: Interface,
    contractRunner: ContractRunner,
    retryTimeout = 1000
  ) {
    const logger = new Logger("Contract");
    super(addressOrName, contractInterface, contractRunner);
    return new Proxy({ contract: this }, getProxyHandler(addressOrName, logger, retryTimeout));
  }
}
