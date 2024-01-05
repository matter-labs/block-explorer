import { BadRequestException } from "@nestjs/common";
import { ParseLimitedIntPipe } from "./parseLimitedInt.pipe";

describe("ParseLimitedIntPipe", () => {
  describe("transform", () => {
    describe("throws a BadRequestException", () => {
      it("if specified input is not valid", async () => {
        const pipe = new ParseLimitedIntPipe();
        expect.assertions(2);

        try {
          await pipe.transform("invalidAddressParam");
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.message).toBe("Validation failed (numeric string is expected)");
        }
      });

      it("if specified value is less than specified min value", async () => {
        const pipe = new ParseLimitedIntPipe({ min: 1, max: 10 });
        expect.assertions(2);

        try {
          await pipe.transform("0");
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.message).toBe("Validation failed: specified int is out of defined boundaries: [1;10].");
        }
      });

      it("if specified value is higher than specified max value", async () => {
        const pipe = new ParseLimitedIntPipe({ min: 1, max: 10 });
        expect.assertions(2);

        try {
          await pipe.transform("11");
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.message).toBe("Validation failed: specified int is out of defined boundaries: [1;10].");
        }
      });

      it("if no min option specified uses 0 as a min value", async () => {
        const pipe = new ParseLimitedIntPipe({ max: 10 });
        expect.assertions(2);

        try {
          await pipe.transform("-10");
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.message).toBe("Validation failed: specified int is out of defined boundaries: [0;10].");
        }
      });

      it("if no max option specified uses max int number as a max value", async () => {
        const pipe = new ParseLimitedIntPipe({ min: 1 });
        expect.assertions(2);

        try {
          await pipe.transform("9007199254740992");
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.message).toBe(
            "Validation failed: specified int is out of defined boundaries: [1;9007199254740991]."
          );
        }
      });
    });

    it("returns undefined when value is not defined and isOptional set to true", async () => {
      const pipe = new ParseLimitedIntPipe({ isOptional: true });

      const parsedInt = await pipe.transform(null);
      expect(parsedInt).toBe(undefined);
    });

    it("returns parsed value", async () => {
      const pipe = new ParseLimitedIntPipe();

      const parsedInt = await pipe.transform("10");
      expect(parsedInt).toBe(10);
    });
  });
});
