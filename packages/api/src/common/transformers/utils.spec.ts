import { FindOperator } from "typeorm";
import { transformFindOperator } from "./utils";

describe("transformers.utils", () => {
  describe("transformFindOperator", () => {
    it("transforms find operator using transform function when value is not an array", () => {
      const value = new Date("2022-11-10T14:44:08.000Z");
      const operator = new FindOperator("lessThanOrEqual", value);
      const result = transformFindOperator(operator, (value) => value.getTime());
      expect(result).toBeInstanceOf(FindOperator<number>);
      expect(result.value).toBe(value.getTime());
    });

    it("transforms find operator using transform function when value is an array", () => {
      const value = [new Date("2022-11-10T14:44:08.000Z"), new Date("2023-11-10T14:44:08.000Z")];
      const operator = new FindOperator("between", value);
      const result = transformFindOperator(operator, (v) => v.getTime());
      expect(result).toBeInstanceOf(FindOperator<number>);
      expect(result.value).toEqual([value[0].getTime(), value[1].getTime()]);
    });
  });
});
