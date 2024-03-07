import { BigNumber } from "ethers";
import { transferFieldsTransformer } from "./transferFields.transformer";

describe("transferFieldsTransformer", () => {
  describe("to", () => {
    it("returns null for undefined input", () => {
      const result = transferFieldsTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns an object unchanged if there is no tokenId field", () => {
      const fields = { field: BigNumber.from(5) };
      const result = transferFieldsTransformer.to(fields);
      expect(result).toBe(fields);
    });

    it("returns fields with tokenId as a string", () => {
      const fields = { tokenId: BigNumber.from(5) };
      const result = transferFieldsTransformer.to(fields);
      expect(result).toStrictEqual({
        tokenId: "5",
      });
    });
  });

  describe("from", () => {
    it("returns null for undefined input", () => {
      const result = transferFieldsTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns an object unchanged if there is no tokenId field", () => {
      const fields = { field: BigNumber.from(5) };
      const result = transferFieldsTransformer.from(fields);
      expect(result).toBe(fields);
    });

    it("returns fields with tokenId as a BigNumber", () => {
      const fields = { tokenId: "5" };
      const result = transferFieldsTransformer.from(fields);
      expect(result).toStrictEqual({
        tokenId: BigNumber.from(5),
      });
    });
  });
});
