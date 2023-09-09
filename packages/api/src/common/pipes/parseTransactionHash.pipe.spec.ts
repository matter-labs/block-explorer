import { BadRequestException } from "@nestjs/common";
import { ParseTransactionHashPipe } from "./parseTransactionHash.pipe";

describe("ParseTransactionHashPipe", () => {
  let pipe: ParseTransactionHashPipe;
  beforeEach(() => {
    pipe = new ParseTransactionHashPipe();
  });

  describe("transform", () => {
    it("throws a BadRequestException if tx hash is not valid", () => {
      expect.assertions(2);

      try {
        pipe.transform("invalidTransactionParam");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("Invalid transaction hash format");
      }
    });

    it("throws a BadRequestException if tx hash does not start with 0x", () => {
      expect.assertions(2);

      try {
        pipe.transform("d99bd0a1ed5de1c258637e40f3e4e1f461375f5ca4712339031a8dade8079e88");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("Invalid transaction hash format");
      }
    });

    it("throws a BadRequestException if tx hash is undefined when it is required", () => {
      expect.assertions(2);

      try {
        pipe.transform(undefined);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe("Invalid transaction hash format");
      }
    });

    it("throws a BadRequestException with custom message when provided", () => {
      pipe = new ParseTransactionHashPipe({ errorMessage: "custom" });
      expect(() => pipe.transform(undefined)).toThrowError(new BadRequestException("custom"));
    });

    it("does not throw a BadRequestException if tx hash is undefined when it is optional", () => {
      pipe = new ParseTransactionHashPipe({ required: false });
      const result = pipe.transform(undefined);
      expect(result).toEqual(undefined);
    });

    it("returns transaction hash for lower case hash", () => {
      const hash = "0xd99bd0a1ed5de1c258637e40f3e4e1f461375f5ca4712339031a8dade8079e88";

      const transformedHash = pipe.transform(hash);
      expect(transformedHash).toBe(hash);
    });

    it("returns transaction hash for upper case hash", () => {
      const hash = "0xD99BD0A1ED5DE1C258637E40F3E4E1F461375F5CA4712339031A8DADE8079E88";

      const transformedHash = pipe.transform(hash);
      expect(transformedHash).toBe(hash);
    });
  });
});
