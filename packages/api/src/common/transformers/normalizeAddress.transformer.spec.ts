import { normalizeAddressTransformer } from "./normalizeAddress.transformer";

describe("normalizeAddressTransformer", () => {
  describe("to", () => {
    it("returns null for null input", () => {
      const result = normalizeAddressTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns a bytes buffer for the hex value with no leading 0x", () => {
      const str = "e8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c";
      const result = normalizeAddressTransformer.to(str);
      expect(result).toStrictEqual(Buffer.from(str, "hex"));
    });

    it("returns a bytes buffer for the hex value with leading 0x", () => {
      const str = "0xe8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c";
      const result = normalizeAddressTransformer.to(str);
      expect(result).toStrictEqual(
        Buffer.from("e8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c", "hex")
      );
    });
  });

  describe("from", () => {
    it("returns null for null input", () => {
      const result = normalizeAddressTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns normalized address string of the buffer", () => {
      const buffer = Buffer.from("f754ff5e8a6f257e162f72578a4bb0493c068111", "hex");
      const result = normalizeAddressTransformer.from(buffer);
      expect(result).toStrictEqual("0xF754FF5E8A6F257e162F72578a4bB0493c068111");
    });
  });
});
