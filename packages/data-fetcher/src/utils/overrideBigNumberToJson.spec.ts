import { BigNumber } from "ethers";
import overrideBigNumberToJson from "./overrideBigNumberToJson";

describe("overrideBigNumberToJson", () => {
  it("overrides BigNumber toJson function", () => {
    const before = BigNumber.from(15).toJSON();
    overrideBigNumberToJson();
    const after = BigNumber.from(15).toJSON();
    expect(before).toStrictEqual({ hex: "0x0f", type: "BigNumber" });
    expect(after).toBe("15");
  });
});
