import { BadRequestException } from "@nestjs/common";
import { ParseAddressPipe } from "./parseAddress.pipe";

describe("ParseAddressPipe", () => {
  let pipe: ParseAddressPipe;
  beforeEach(() => {
    pipe = new ParseAddressPipe();
  });

  describe("transform", () => {
    describe("when address is not required", () => {
      it("allows null values for a single address", () => {
        pipe = new ParseAddressPipe({ required: false });
        const result = pipe.transform(null);
        expect(result).toBeNull();
      });

      it("allows null values for address list", () => {
        pipe = new ParseAddressPipe({ required: false, each: true });
        const result = pipe.transform(null);
        expect(result).toEqual(null);
      });
    });

    it("does not allow address list when each flag is false", () => {
      pipe = new ParseAddressPipe({ required: false });
      expect(() => pipe.transform(["0XD754FF5E8a6F257E162f72578a4bB0493c068101"])).toThrowError(
        new BadRequestException("Invalid Address format")
      );
    });

    it("does not allow single address when each flag is true", () => {
      pipe = new ParseAddressPipe({ required: false, each: true });
      expect(() => pipe.transform("0XD754FF5E8a6F257E162f72578a4bB0493c068101")).toThrowError(
        new BadRequestException("Invalid Address format")
      );
    });

    it("throws a BadRequestException if address is not valid", () => {
      expect(() => pipe.transform("invalidAddressParam")).toThrowError(
        new BadRequestException("Invalid Address format")
      );
    });

    it("throws a BadRequestException if address starts with a capital 0X", () => {
      expect(() => pipe.transform("0XD754FF5E8a6F257E162f72578a4bB0493c068101")).toThrowError(
        new BadRequestException("Invalid Address format")
      );
    });

    it("returns lower case address when called with a single address", () => {
      const address = "0xD754FF5E8a6F257E162f72578a4bB0493c068101";

      const transformedAddress = pipe.transform(address);
      expect(transformedAddress).toBe(address.toLowerCase());
    });

    it("returns lower case addresses when called with address list", () => {
      pipe = new ParseAddressPipe({ required: true, each: true });
      const addresses = ["0xD754FF5E8a6F257E162f72578a4bB0493c068101", "0xD754FF5E8a6F257E162f72578a4bB0493c068102"];

      const transformedAddresses = pipe.transform(addresses);
      expect(transformedAddresses).toEqual(addresses.map((addr) => addr.toLowerCase()));
    });

    it("throws a BadRequestException with a custom message when it is provided", () => {
      pipe = new ParseAddressPipe({ required: true, errorMessage: "Custom error message" });
      expect(() => pipe.transform("0XD754FF5E8a6F257E162f72578a4bB0493c068101")).toThrowError(
        new BadRequestException("Custom error message")
      );
    });
  });
});
