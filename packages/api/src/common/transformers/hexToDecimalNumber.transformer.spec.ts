import { hexToDecimalNumberTransformer } from "./hexToDecimalNumber.transformer";

describe("hexToDecimalNumberTransformer", () => {
  describe("to", () => {
    it("returns null for null input", () => {
      const result = hexToDecimalNumberTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns hex representation of the decimal number string", () => {
      const result = hexToDecimalNumberTransformer.to("800");
      expect(result).toBe("0x320");
    });
  });

  describe("from", () => {
    it("returns null for null input", () => {
      const result = hexToDecimalNumberTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns decimal representation of the hex number string", () => {
      const result = hexToDecimalNumberTransformer.from("0x320");
      expect(result).toBe("800");
    });
  });
});
