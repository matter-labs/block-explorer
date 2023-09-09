import { BigNumber } from "ethers";
import { bigNumberTransformer } from "./bigNumber.transformer";

describe("bigNumberTransformer", () => {
  describe("to", () => {
    it("returns null for undefined input", () => {
      const result = bigNumberTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns string representation of BigNumber", () => {
      const bigNumberStr = "10000000000000000000000000000000000000000";
      const result = bigNumberTransformer.to(BigNumber.from(bigNumberStr));
      expect(result).toBe(bigNumberStr);
    });

    it("returns string representation of number", () => {
      const numberStr = "1000000000000000000";
      const result = bigNumberTransformer.to(Number(numberStr));
      expect(result).toBe(numberStr);
    });
  });

  describe("from", () => {
    it("returns null for undefined input", () => {
      const result = bigNumberTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns string representation of BigNumber", () => {
      const bigNumberStr = "10000000000000000000000000000000000000000";
      const result = bigNumberTransformer.from(bigNumberStr);
      expect(result).toStrictEqual(BigNumber.from(bigNumberStr));
    });
  });
});
