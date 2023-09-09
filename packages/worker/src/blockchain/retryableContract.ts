import { Logger } from "@nestjs/common";
import { Provider } from "@ethersproject/abstract-provider";
import { setTimeout } from "timers/promises";
import { Contract, ContractInterface, Signer, errors } from "ethers";

interface EthersError {
  code: string;
  method: string;
  transaction: {
    data: string;
    to: string;
  };
  message: string;
}

const MAX_RETRY_INTERVAL = 60000;

const PERMANENT_ERRORS: string[] = [
  errors.INVALID_ARGUMENT,
  errors.MISSING_ARGUMENT,
  errors.UNEXPECTED_ARGUMENT,
  errors.NOT_IMPLEMENTED,
];

const shouldRetry = (calledFunctionName: string, error: EthersError): boolean => {
  return (
    !PERMANENT_ERRORS.includes(error.code) &&
    !(
      error.code === errors.CALL_EXCEPTION &&
      error.method?.startsWith(`${calledFunctionName}(`) &&
      !!error.transaction &&
      error.message?.startsWith("call revert exception")
    )
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
    const isRetryable = shouldRetry(functionName, error);
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
    contractInterface: ContractInterface,
    signerOrProvider: Signer | Provider,
    retryTimeout = 1000
  ) {
    const logger = new Logger("Contract");
    super(addressOrName, contractInterface, signerOrProvider);
    return new Proxy({ contract: this }, getProxyHandler(addressOrName, logger, retryTimeout));
  }
}
