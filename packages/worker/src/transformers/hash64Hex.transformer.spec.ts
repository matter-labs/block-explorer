import { hash64HexTransformer } from "./hash64Hex.transformer";
import { ZERO_HASH_64 } from "../constants";

describe("hash64HexTransformer", () => {
  describe("to", () => {
    it("returns null for null input", () => {
      const result = hash64HexTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns null for zero transaction hash", () => {
      const result = hash64HexTransformer.to(ZERO_HASH_64);
      expect(result).toBeNull();
    });

    it("returns a bytes buffer for the hex value with no leading 0x", () => {
      const str = "e8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c";
      const result = hash64HexTransformer.to(str);
      expect(result).toStrictEqual(Buffer.from(str, "hex"));
    });

    it("returns a bytes buffer for the hex value with leading 0x", () => {
      const str = "0xe8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c";
      const result = hash64HexTransformer.to(str);
      expect(result).toStrictEqual(
        Buffer.from("e8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c", "hex")
      );
    });
  });

  describe("from", () => {
    it("returns null for null input", () => {
      const result = hash64HexTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns string hex representation of the buffer", () => {
      const buffer = Buffer.from("e8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c", "hex");
      const result = hash64HexTransformer.from(buffer);
      expect(result).toStrictEqual("0xe8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c");
    });
  });
});
