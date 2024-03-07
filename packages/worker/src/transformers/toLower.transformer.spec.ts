import { toLowerTransformer } from "./toLower.transformer";

describe("toLowerTransformer", () => {
  describe("to", () => {
    it("returns null for null input", () => {
      const result = toLowerTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns a lower case version of an input string", () => {
      const str = "abcABCaAbBcC";
      const result = toLowerTransformer.to(str);
      expect(result).toBe(str.toLowerCase());
    });
  });

  describe("from", () => {
    it("returns null for null input", () => {
      const result = toLowerTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns input string", () => {
      const str = "abcABCaAbBcC";
      const result = toLowerTransformer.from(str);
      expect(result).toStrictEqual(str);
    });
  });
});
