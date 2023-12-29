import { stringDateTransformer } from "./stringDate.transformer";

describe("stringDateTransformer", () => {
  describe("to", () => {
    it("returns null for null input", () => {
      const result = stringDateTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns Date parsed from string", () => {
      const strDate = "2023-12-28T17:49:03.048Z";
      const result = stringDateTransformer.to(strDate);
      expect(result).toStrictEqual(new Date(strDate));
    });
  });

  describe("from", () => {
    it("returns null for null input", () => {
      const result = stringDateTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns ISO string for the Date", () => {
      const strDate = "2023-12-28T17:49:03.048Z";
      const result = stringDateTransformer.from(new Date(strDate));
      expect(result).toBe(strDate);
    });
  });
});
