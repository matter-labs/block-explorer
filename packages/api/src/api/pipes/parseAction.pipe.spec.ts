import { BadRequestException } from "@nestjs/common";
import { ApiModule, ApiContractAction } from "../types";
import { ParseActionPipe } from "./parseAction.pipe";

describe("ParseActionPipe", () => {
  describe("transform", () => {
    it("throws error when action is not supported for a given module", () => {
      const pipe = new ParseActionPipe();
      expect(() => pipe.transform({ module: ApiModule.Contract, action: "not-supported" })).toThrowError(
        new BadRequestException("Error! Missing Or invalid Action name")
      );
    });

    it("throws error when module is not supported", () => {
      const pipe = new ParseActionPipe();
      expect(() => pipe.transform({ module: "not-supported" as ApiModule, action: "not-supported" })).toThrowError(
        new BadRequestException("Error! Missing Or invalid Action name")
      );
    });

    it("returns action when it is supported", () => {
      const pipe = new ParseActionPipe();
      const action = pipe.transform({ module: ApiModule.Contract, action: ApiContractAction.GetAbi });
      expect(action).toBe(ApiContractAction.GetAbi);
    });
  });
});
