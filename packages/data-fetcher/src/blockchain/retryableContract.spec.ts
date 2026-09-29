import * as ethers from "ethers";
import { mock } from "jest-mock-extended";
import { utils } from "zksync-ethers";
import { setTimeout } from "timers/promises";
import { RetryableContract } from "./retryableContract";

jest.mock("../config", () => ({
  default: () => ({
    blockchain: {
      rpcCallRetriesMaxTotalTimeout: 200000,
    },
  }),
}));

jest.mock("ethers", () => ({
  ...jest.requireActual("ethers"),
  Contract: jest.fn(),
}));

jest.mock("@nestjs/common", () => ({
  Logger: jest.fn().mockReturnValue({
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  }),
}));

jest.mock("timers/promises", () => ({
  setTimeout: jest.fn().mockResolvedValue(null),
}));

describe("RetryableContract", () => {
  const tokenAddress = "tokenAddress";
  const providerMock = mock<ethers.ContractRunner>({});

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("inits Contract instance with specified ctor params", async () => {
      new RetryableContract(tokenAddress, utils.IERC20, providerMock);
      expect(ethers.Contract).toHaveBeenCalledTimes(1);
      expect(ethers.Contract).toBeCalledWith(tokenAddress, utils.IERC20, providerMock);
    });
  });

  describe("contract field access", () => {
    const fieldValue = "fieldValue";
    let contract: RetryableContract;

    beforeEach(() => {
      (ethers.Contract as any as jest.Mock).mockReturnValue({
        contractField: fieldValue,
      });

      contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock);
    });

    it("returns field value", () => {
      const result = contract.contractField;
      expect(result).toBe(fieldValue);
    });
  });

  describe("contract sync function call", () => {
    const functionResult = "functionResult";
    let contract: RetryableContract;

    beforeEach(() => {
      (ethers.Contract as any as jest.Mock).mockReturnValue({
        contractFn: () => functionResult,
      });

      contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock);
    });

    it("returns function call result", () => {
      const result = contract.contractFn();
      expect(result).toBe(functionResult);
    });
  });

  describe("contract async function call", () => {
    const functionResult = "functionResult";
    let contract: RetryableContract;

    beforeEach(() => {
      (ethers.Contract as any as jest.Mock).mockReturnValue({
        contractFn: async () => functionResult,
      });

      contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock);
    });

    it("returns function call async result", async () => {
      const result = await contract.contractFn();
      expect(result).toBe(functionResult);
    });

    describe("when throws a permanent execution reverted error", () => {
      const callExceptionError = {
        code: 3,
        shortMessage: "execution reverted...",
      };

      beforeEach(() => {
        (ethers.Contract as any as jest.Mock).mockReturnValue({
          contractFn: async () => {
            throw callExceptionError;
          },
        });

        contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock);
      });

      it("throws an error", async () => {
        expect.assertions(1);

        try {
          await contract.contractFn();
        } catch (e) {
          expect(e).toBe(callExceptionError);
        }
      });
    });

    describe("when throws a permanent could not decode result data error", () => {
      const callExceptionError = {
        code: "BAD_DATA",
        shortMessage: "could not decode result data...",
      };

      beforeEach(() => {
        (ethers.Contract as any as jest.Mock).mockReturnValue({
          contractFn: async () => {
            throw callExceptionError;
          },
        });

        contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock);
      });

      it("throws an error", async () => {
        expect.assertions(1);

        try {
          await contract.contractFn();
        } catch (e) {
          expect(e).toBe(callExceptionError);
        }
      });
    });

    describe("when throws a permanent invalid length for result data error", () => {
      const badDataError = {
        code: "BAD_DATA",
        shortMessage: "invalid length for result data",
      };

      beforeEach(() => {
        let countOfRequests = 0;
        (ethers.Contract as any as jest.Mock).mockReturnValue({
          // a result is returned if the call is retried
          contractFn: async () => {
            if (!countOfRequests++) {
              throw badDataError;
            }
            return "functionResult";
          },
        });

        contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock);
      });

      it("throws the error without retrying", async () => {
        await expect(contract.contractFn()).rejects.toBe(badDataError);
        expect(setTimeout).not.toBeCalled();
      });
    });

    describe("when throws an invalid argument function error", () => {
      const invalidArgumentError = {
        code: "INVALID_ARGUMENT",
      };

      beforeEach(() => {
        (ethers.Contract as any as jest.Mock).mockReturnValue({
          contractFn: async () => {
            throw invalidArgumentError;
          },
        });

        contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock);
      });

      it("throws an error", async () => {
        expect.assertions(1);

        try {
          await contract.contractFn();
        } catch (e) {
          expect(e).toBe(invalidArgumentError);
        }
      });
    });

    describe("when the contract returns an invalid UTF-8 string", () => {
      beforeEach(() => {
        const { AbiCoder, Contract } = jest.requireActual("ethers");
        let countOfRequests = 0;
        (ethers.Contract as any as jest.Mock).mockReturnValue(
          new Contract("0x0000000000000000000000000000000000000001", utils.IERC20, {
            // string and bytes have the same ABI encoding, a valid string is returned if the call is retried
            call: async () =>
              AbiCoder.defaultAbiCoder().encode(["bytes"], [countOfRequests++ ? "0x4c313131" : "0xfffe"]),
          })
        );

        contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock);
      });

      it("throws the deferred decoding error without retrying", async () => {
        await expect(contract.symbol()).rejects.toThrowError(
          "deferred error during ABI decoding triggered accessing index 0"
        );
        expect(setTimeout).not.toBeCalled();
      });
    });

    describe("when throws a few network errors before returning a result", () => {
      const functionResult = "functionResult";
      const error = new Error();
      (error as any).code = "NETWORK_ERROR";

      beforeEach(() => {
        let countOfFailedRequests = 0;
        (ethers.Contract as any as jest.Mock).mockReturnValue({
          contractFn: async () => {
            if (countOfFailedRequests++ < 4) {
              throw error;
            }
            return functionResult;
          },
        });

        contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock, 20000);
      });

      it("retries and returns the result when it's available", async () => {
        const result = await contract.contractFn();
        expect(result).toBe(functionResult);
        expect(setTimeout).toBeCalledTimes(4);
        expect(setTimeout).toBeCalledWith(20000);
        expect(setTimeout).toBeCalledWith(40000);
        expect(setTimeout).toBeCalledWith(60000);
        expect(setTimeout).toBeCalledWith(60000);
      });

      describe("and retries total time exceeds the retries total max timeout", () => {
        beforeEach(() => {
          let countOfFailedRequests = 0;
          (ethers.Contract as any as jest.Mock).mockReturnValue({
            contractFn: async () => {
              if (countOfFailedRequests++ < 5) {
                throw error;
              }
              return functionResult;
            },
          });

          contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock, 20000);
        });

        it("throws an error", async () => {
          await expect(contract.contractFn()).rejects.toThrowError(error);
        });
      });
    });

    describe("when throws a few errors with no method or message before returning a result", () => {
      const functionResult = "functionResult";
      const error = new Error();
      (error as any).code = 3;

      beforeEach(() => {
        let countOfFailedRequests = 0;
        (ethers.Contract as any as jest.Mock).mockReturnValue({
          contractFn: async () => {
            countOfFailedRequests++;
            if (countOfFailedRequests <= 2) {
              throw {
                ...error,
                transaction: {},
                method: "contractFn()",
              };
            }
            if (countOfFailedRequests <= 4) {
              throw error;
            }
            return functionResult;
          },
        });

        contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock, 20000);
      });

      it("retries and returns the result when it's available", async () => {
        const result = await contract.contractFn();
        expect(result).toBe(functionResult);
        expect(setTimeout).toBeCalledTimes(4);
        expect(setTimeout).toBeCalledWith(20000);
        expect(setTimeout).toBeCalledWith(40000);
        expect(setTimeout).toBeCalledWith(60000);
        expect(setTimeout).toBeCalledWith(60000);
      });

      describe("and retries total time exceeds the retries total max timeout", () => {
        beforeEach(() => {
          let countOfFailedRequests = 0;
          (ethers.Contract as any as jest.Mock).mockReturnValue({
            contractFn: async () => {
              if (countOfFailedRequests++ < 5) {
                throw error;
              }
              return functionResult;
            },
          });

          contract = new RetryableContract(tokenAddress, utils.IERC20, providerMock, 20000);
        });

        it("throws an error", async () => {
          await expect(contract.contractFn()).rejects.toThrowError(error);
        });
      });
    });
  });
});
