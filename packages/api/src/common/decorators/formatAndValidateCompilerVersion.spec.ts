import { validate } from "class-validator";
import { FormatAndValidateCompilerVersion } from "./formatAndValidateCompilerVersion";

class TestDto {
  constructor(version: string) {
    this.version = version;
  }

  @FormatAndValidateCompilerVersion()
  public version: string;
}

describe("FormatAndValidateCompilerVersion", () => {
  it("when version is null returns a validation error", async () => {
    const errors = await validate(new TestDto(null));
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe("version");
  });

  it("when version is an empty string returns a validation error", async () => {
    const errors = await validate(new TestDto(""));
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe("version");
  });

  it("when version is a valid", async () => {
    const errors = await validate(new TestDto("2.3.7"));
    expect(errors.length).toBe(0);
  });

  it("when version is valid with commit", async () => {
    const errors = await validate(new TestDto("2.5.7-commit.32"));
    expect(errors.length).toBe(0);
  });
});
