import { mock } from "jest-mock-extended";
import { Interface, LogDescription, Result } from "ethers";
import { types } from "zksync-ethers";
import parseLog from "./parseLog";

jest.mock("../logger", () => ({
  default: {
    error: jest.fn(),
  },
}));

describe("parseLog", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("parses log", () => {
    const log = mock<types.Log>({
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
        const log = mock<types.Log>({ topics: [] });
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
        const log = mock<types.Log>({ topics: [] });
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
        const log = mock<types.Log>({ topics: [] });
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
        const log = mock<types.Log>({ topics: [] });
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
          const log = mock<types.Log>({ topics: [] });
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
          const log = mock<types.Log>({ topics: [] });
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
          const log = mock<types.Log>({ topics: [] });
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
          const log = mock<types.Log>({ topics: [] });
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
          const log = mock<types.Log>({ topics: [] });
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
          const log = mock<types.Log>({ topics: ["topic0", "topic1"] });
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
          } as unknown as types.Log;
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
});
