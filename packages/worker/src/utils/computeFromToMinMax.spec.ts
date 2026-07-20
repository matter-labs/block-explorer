import { computeFromToMinMax } from "./computeFromToMinMax";

describe("computeFromToMinMax", () => {
  it("returns fromToMin=from and fromToMax=to when from < to lexicographically", () => {
    expect(computeFromToMinMax("0xaaa", "0xbbb")).toEqual({ fromToMin: "0xaaa", fromToMax: "0xbbb" });
  });

  it("returns fromToMin=to and fromToMax=from when from > to lexicographically", () => {
    expect(computeFromToMinMax("0xbbb", "0xaaa")).toEqual({ fromToMin: "0xaaa", fromToMax: "0xbbb" });
  });

  it("returns fromToMin=from and fromToMax=to when from equals to", () => {
    expect(computeFromToMinMax("0xaaa", "0xaaa")).toEqual({ fromToMin: "0xaaa", fromToMax: "0xaaa" });
  });

  it("compares addresses case-insensitively", () => {
    // "0xAAA".toLowerCase() = "0xaaa" <= "0xbbb"
    expect(computeFromToMinMax("0xAAA", "0xbbb")).toEqual({ fromToMin: "0xAAA", fromToMax: "0xbbb" });
  });

  it("returns nulls when from is falsy", () => {
    expect(computeFromToMinMax(null, "0xbbb")).toEqual({ fromToMin: null, fromToMax: null });
  });

  it("returns nulls when to is undefined", () => {
    expect(computeFromToMinMax("0xaaa", undefined)).toEqual({ fromToMin: null, fromToMax: null });
  });

  it("returns nulls when both are falsy", () => {
    expect(computeFromToMinMax(null, null)).toEqual({ fromToMin: null, fromToMax: null });
  });
});
