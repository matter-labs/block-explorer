import { BadRequestException } from "@nestjs/common";
import { ApiModule } from "../types";
import { ParseModulePipe } from "./parseModule.pipe";

describe("ParseModulePipe", () => {
  describe("transform", () => {
    it("throws error when module is not supported", () => {
      const pipe = new ParseModulePipe();
      expect(() => pipe.transform("not-supported" as ApiModule.Contract)).toThrowError(
        new BadRequestException("Error! Missing Or invalid Module name")
      );
    });

    it("returns module when it is supported", () => {
      const pipe = new ParseModulePipe();
      const action = pipe.transform(ApiModule.Contract);
      expect(action).toBe(ApiModule.Contract);
    });
  });
});
