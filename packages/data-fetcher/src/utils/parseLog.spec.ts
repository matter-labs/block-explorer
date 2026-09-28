import { mock } from "jest-mock-extended";
import { AbiCoder, Interface, LogDescription, Result, getAddress, zeroPadValue } from "ethers";
import { Log } from "ethers";
import parseLog from "./parseLog";

jest.mock("../logger", () => ({
  default: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("parseLog", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns undefined when parseLog throws", () => {
    const log = mock<Log>({
      topics: [],
      blockNumber: 1,
      index: 0,
      transactionHash: "0x1234",
    });
    const contractInterface = mock<Interface>({
      parseLog: jest.fn().mockImplementation(() => {
        throw new Error("could not decode log data");
      }),
    });

    const result = parseLog(
      {
        interface: contractInterface,
      },
      log
    );
    expect(result).toBeUndefined();
  });

  it("returns undefined when parseLog returns null", () => {
    const log = mock<Log>({
      topics: [],
    });
    const contractInterface = mock<Interface>({
      parseLog: jest.fn().mockReturnValue(null),
    });

    const result = parseLog(
      {
        interface: contractInterface,
      },
      log
    );
    expect(result).toBeUndefined();
  });

  it("parses log", () => {
    const log = mock<Log>({
      topics: [],
    });
    const parsedLog = mock<LogDescription>({ args: mock<Result>() });
    const contractInterface = mock<Interface>({
      parseLog: jest.fn().mockReturnValue(parsedLog),
    });

    const result = parseLog(
      {
        interface: contractInterface,
      },
      log
    );
    expect(result).toBe(parsedLog);
  });

  describe("when some of the arguments fail to be parsed", () => {
    let contractInterface;
    let parsedLog;
    beforeEach(() => {
      parsedLog = {
        args: {
          from: "from",
          get to() {
            throw new Error("failed to parse");
          },
        },
      };
      contractInterface = mock<Interface>({
        parseLog: jest
          .fn()
          .mockReturnValueOnce(parsedLog)
          .mockReturnValueOnce({
            args: {
              from: "from",
              amount: "amount",
              to: "to",
            },
          }),
      });
    });

    describe("and parsed log does not have eventFragment", () => {
      it("returns parsed log as it is", () => {
        const log = mock<Log>({ topics: [] });
        const result = parseLog(
          {
            interface: contractInterface,
          },
          log
        );
        expect(result).toBe(parsedLog);
        expect(contractInterface.parseLog).toBeCalledTimes(1);
      });
    });

    describe("and parsed log has eventFragment with type different to event", () => {
      it("returns parsed log as it is", () => {
        parsedLog.fragment = {
          type: "function",
        };
        const log = mock<Log>({ topics: [] });
        const result = parseLog(
          {
            interface: contractInterface,
          },
          log
        );
        expect(result).toBe(parsedLog);
        expect(contractInterface.parseLog).toBeCalledTimes(1);
      });
    });

    describe("and parsed log has eventFragment with no inputs", () => {
      it("returns parsed log as it is", () => {
        parsedLog.fragment = {
          type: "event",
        };
        const log = mock<Log>({ topics: [] });
        const result = parseLog(
          {
            interface: contractInterface,
          },
          log
        );
        expect(result).toBe(parsedLog);
        expect(contractInterface.parseLog).toBeCalledTimes(1);
      });
    });

    describe("and parsed log has eventFragment with empty inputs array", () => {
      it("returns parsed log as it is", () => {
        parsedLog.fragment = {
          type: "event",
          inputs: [],
        };
        const log = mock<Log>({ topics: [] });
        const result = parseLog(
          {
            interface: contractInterface,
          },
          log
        );
        expect(result).toBe(parsedLog);
        expect(contractInterface.parseLog).toBeCalledTimes(1);
      });
    });

    describe("and parsed log has eventFragment with event type and inputs", () => {
      describe("and parser throws an error with no error details", () => {
        it("returns parsed log as it is", () => {
          parsedLog.fragment = {
            type: "event",
            inputs: [
              {
                name: "to",
              },
            ],
          };
          const log = mock<Log>({ topics: [] });
          const result = parseLog(
            {
              interface: contractInterface,
            },
            log
          );
          expect(result).toBe(parsedLog);
          expect(contractInterface.parseLog).toBeCalledTimes(1);
        });
      });

      describe("and parser throws an error with error reason different than value out of range", () => {
        it("returns parsed log as it is", () => {
          parsedLog.fragment = {
            type: "event",
            inputs: [
              {
                name: "to",
              },
            ],
          };
          parsedLog.args = {
            get to() {
              throw {
                error: {
                  reason: "unknown",
                  type: "address",
                },
              };
            },
          };
          const log = mock<Log>({ topics: [] });
          const result = parseLog(
            {
              interface: contractInterface,
            },
            log
          );
          expect(result).toBe(parsedLog);
          expect(contractInterface.parseLog).toBeCalledTimes(1);
        });
      });

      describe("and parser throws an error with error type not equal to address", () => {
        it("returns parsed log as it is", () => {
          parsedLog.fragment = {
            type: "event",
            inputs: [
              {
                name: "to",
              },
            ],
          };
          parsedLog.args = {
            get to() {
              throw {
                error: {
                  reason: "value out of range",
                  type: "hex",
                },
              };
            },
          };
          const log = mock<Log>({ topics: [] });
          const result = parseLog(
            {
              interface: contractInterface,
            },
            log
          );
          expect(result).toBe(parsedLog);
          expect(contractInterface.parseLog).toBeCalledTimes(1);
        });
      });

      describe("and there is no input with name matching the parser error name", () => {
        it("returns parsed log as it is", () => {
          parsedLog.fragment = {
            type: "event",
            inputs: [
              {
                name: "to",
              },
            ],
          };
          parsedLog.args = {
            get to() {
              throw {
                error: {
                  reason: "value out of range",
                  type: "address",
                  name: "from",
                },
              };
            },
          };
          const log = mock<Log>({ topics: [] });
          const result = parseLog(
            {
              interface: contractInterface,
            },
            log
          );
          expect(result).toBe(parsedLog);
          expect(contractInterface.parseLog).toBeCalledTimes(1);
        });
      });

      describe("and failed arg is not indexed", () => {
        it("returns parsed log as it is", () => {
          parsedLog.fragment = {
            type: "event",
            inputs: [
              {
                name: "to",
                indexed: false,
              },
            ],
          };
          parsedLog.args = {
            get to() {
              throw {
                error: {
                  reason: "value out of range",
                  type: "address",
                  name: "to",
                },
              };
            },
          };
          const log = mock<Log>({ topics: [] });
          const result = parseLog(
            {
              interface: contractInterface,
            },
            log
          );
          expect(result).toBe(parsedLog);
          expect(contractInterface.parseLog).toBeCalledTimes(1);
        });
      });

      describe("and there is no topic found for failed arg", () => {
        it("returns parsed log as it is", () => {
          parsedLog.fragment = {
            type: "event",
            inputs: [
              {
                name: "from",
                indexed: true,
              },
              {
                name: "to",
                indexed: true,
              },
            ],
          };
          parsedLog.args = {
            from: "from",
            get to() {
              throw {
                error: {
                  reason: "value out of range",
                  type: "address",
                  name: "to",
                },
              };
            },
          };
          const log = mock<Log>({ topics: ["topic0", "topic1"] });
          const result = parseLog(
            {
              interface: contractInterface,
            },
            log
          );
          expect(result).toBe(parsedLog);
          expect(contractInterface.parseLog).toBeCalledTimes(1);
        });
      });

      describe("and there is a topic for failed arg", () => {
        it("fixes out of range address args and returns parsed log", () => {
          parsedLog.fragment = {
            type: "event",
            inputs: [
              {
                name: "from",
                indexed: true,
              },
              {
                name: "amount",
                indexed: true,
              },
              {
                name: "to",
                indexed: true,
              },
            ],
          };
          parsedLog.args = {
            get "0"() {
              throw {
                error: {
                  error: {
                    code: "NUMERIC_FAULT",
                    fault: "overflow",
                    type: "address",
                  },
                },
              };
            },
            "1": "amount",
            get "2"() {
              throw {
                error: {
                  error: {
                    code: "NUMERIC_FAULT",
                    fault: "overflow",
                    type: "address",
                  },
                },
              };
            },
          };
          const log = {
            index: 1,
            topics: [
              "topic0",
              "0x00000000000000000000001438686aa0f4e8fc2fd2910272671b26ff9c53c73a",
              "topic2",
              "0x00000000000000000000001548686aa0f4e8fc2fd2910272671b26ff9c53c73a",
            ],
          } as unknown as Log;
          const result = parseLog(
            {
              interface: contractInterface,
            },
            log
          );
          expect(result).toEqual({
            args: {
              from: "from",
              amount: "amount",
              to: "to",
            },
          });
          expect(contractInterface.parseLog).toBeCalledTimes(2);
          expect(contractInterface.parseLog).toBeCalledWith(log);
          expect(contractInterface.parseLog).toBeCalledWith({
            index: 1,
            topics: [
              "topic0",
              "0x00000000000000000000000038686aa0f4e8fc2fd2910272671b26ff9c53c73a",
              "topic2",
              "0x00000000000000000000000048686aa0f4e8fc2fd2910272671b26ff9c53c73a",
            ],
          });
        });
      });
    });
  });

  describe("when non-indexed address args are out of range", () => {
    const abiCoder = AbiCoder.defaultAbiCoder();
    const address = "0x38686aa0f4e8fc2fd2910272671b26ff9c53c73a";
    const outOfRangeAddress = (BigInt(1) << BigInt(160)) + BigInt(address);

    it("fixes out of range address args in data and returns parsed log", () => {
      const contractInterface = new Interface(["event Transfer(address from, address to, uint256 value)"]);
      const log = {
        topics: [contractInterface.getEvent("Transfer").topicHash],
        data: abiCoder.encode(["uint256", "uint256", "uint256"], [outOfRangeAddress, outOfRangeAddress, BigInt(5)]),
      } as unknown as Log;
      const result = parseLog({ interface: contractInterface }, log);
      expect(result.args.from).toBe(getAddress(address));
      expect(result.args.to).toBe(getAddress(address));
      expect(result.args.value).toBe(BigInt(5));
    });

    it("fixes the arg word located after indexed and dynamic args", () => {
      const contractInterface = new Interface([
        "event Test(uint256 amount, address indexed sender, string name, address receiver)",
      ]);
      const log = {
        topics: [contractInterface.getEvent("Test").topicHash, zeroPadValue(address, 32)],
        data: abiCoder.encode(["uint256", "string", "uint256"], [BigInt(7), "name", outOfRangeAddress]),
      } as unknown as Log;
      const result = parseLog({ interface: contractInterface }, log);
      expect(result.args.amount).toBe(BigInt(7));
      expect(result.args.sender).toBe(getAddress(address));
      expect(result.args.name).toBe("name");
      expect(result.args.receiver).toBe(getAddress(address));
    });

    it("returns parsed log as it is when arg word cannot be located", () => {
      const contractInterface = new Interface(["event Test((uint256,uint256) pair, address receiver)"]);
      const log = {
        topics: [contractInterface.getEvent("Test").topicHash],
        data: abiCoder.encode(["tuple(uint256,uint256)", "uint256"], [[BigInt(1), BigInt(2)], outOfRangeAddress]),
      } as unknown as Log;
      const result = parseLog({ interface: contractInterface }, log);
      expect(() => result.args.receiver).toThrow("deferred error during ABI decoding");
    });
  });
});
