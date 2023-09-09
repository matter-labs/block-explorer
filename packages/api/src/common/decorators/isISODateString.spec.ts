import { validate } from "class-validator";
import { IsISODateString } from "./isISODateString";

class TestDto {
  constructor(_date: string) {
    this.date = _date;
  }

  @IsISODateString()
  public date: string;
}

describe("IsISODateString", () => {
  it("when date is null returns a validation error", async () => {
    const errors = await validate(new TestDto(null));
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe("date");
  });

  it("when date is an empty string returns a validation error", async () => {
    const errors = await validate(new TestDto(""));
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe("date");
  });

  it("when date is not a valid ISO date string returns a validation error", async () => {
    const errors = await validate(new TestDto("20000107"));
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe("date");
  });

  it("when date is a valid ISO date string in upper case returns a validation error", async () => {
    const errors = await validate(new TestDto("2020-04-25T00:43:26.000Z"));
    expect(errors.length).toBe(0);
  });

  it("when date is a valid ISO date string in lower case returns a validation error", async () => {
    const errors = await validate(new TestDto("2020-04-25t00:43:26.000z"));
    expect(errors.length).toBe(0);
  });
});
