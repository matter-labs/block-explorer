import { bigIntNumberTransformer } from "./bigIntNumber.transformer";

describe("bigIntNumberTransformer", () => {
  describe("to", () => {
    it("returns null for null input", () => {
      const result = bigIntNumberTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns number with no modifications", () => {
      const number = Number.MAX_SAFE_INTEGER;
      const result = bigIntNumberTransformer.to(number);
      expect(result).toBe(number);
    });
  });

  describe("from", () => {
    it("returns null for null input", () => {
      const result = bigIntNumberTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns number representation of bigint string", () => {
      const bigNumberStr = "9007199254740991";
      const result = bigIntNumberTransformer.from(bigNumberStr);
      expect(result).toEqual(9007199254740991);
    });
  });
});
