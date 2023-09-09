import { hexTransformer } from "./hex.transformer";
import { IsNull } from "typeorm";

describe("hexTransformer", () => {
  describe("to", () => {
    it("returns null for null input", () => {
      const result = hexTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns a bytes buffer for the hex value with no leading 0x", () => {
      const str = "e8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c";
      const result = hexTransformer.to(str);
      expect(result).toStrictEqual(Buffer.from(str, "hex"));
    });

    it("returns a bytes buffer for the hex value with leading 0x", () => {
      const str = "0xe8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c";
      const result = hexTransformer.to(str);
      expect(result).toStrictEqual(
        Buffer.from("e8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c", "hex")
      );
    });

    it("returns incoming value if it's a FindOperator", () => {
      const findOperator = IsNull();
      const result = hexTransformer.to(findOperator);
      expect(result).toBe(findOperator);
    });
  });

  describe("from", () => {
    it("returns null for null input", () => {
      const result = hexTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns string hex representation of the buffer", () => {
      const buffer = Buffer.from("e8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c", "hex");
      const result = hexTransformer.from(buffer);
      expect(result).toStrictEqual("0xe8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c");
    });
  });
});
