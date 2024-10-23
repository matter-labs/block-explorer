import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { isLogOfType, LogType } from "./logType";

describe("isLogOfType", () => {
  let log: types.Log;
  beforeEach(() => {
    log = mock<types.Log>({
      topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", "arg1"],
    });
  });

  it("returns true if the first log topic is equal to any of the specified event hashes", () => {
    const result = isLogOfType(log, [LogType.Approval, LogType.Transfer, LogType.BridgeBurn]);
    expect(result).toBe(true);
  });

  it("returns false if the first log topic isn't equal to any of the specified event hashes", () => {
    const result = isLogOfType(log, [LogType.BridgeBurn, LogType.Approval, LogType.BridgeInitialization]);
    expect(result).toBe(false);
  });
});
