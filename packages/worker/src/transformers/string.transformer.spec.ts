import { stringTransformer } from "./string.transformer";

describe("stringTransformer", () => {
  describe("to", () => {
    it("returns null for null input", () => {
      const result = stringTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns empty string for empty string input", () => {
      const result = stringTransformer.to("");
      expect(result).toBe("");
    });

    it("returns a string as it is if there are no 0 bytes", () => {
      const str = "abcABCaAbBcC";
      const result = stringTransformer.to(str);
      expect(result).toBe(str);
    });

    it("returns a string with 0 bytes removed if there are 0 bytes in string", () => {
      const str = "abc\u0000A\u0000BCaAbBcC";
      const result = stringTransformer.to(str);
      expect(result).toBe("abcABCaAbBcC");
    });
  });

  describe("from", () => {
    it("returns null for null input", () => {
      const result = stringTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns input string", () => {
      const str = "abcABCaAbBcC";
      const result = stringTransformer.from(str);
      expect(result).toStrictEqual(str);
    });
  });
});
