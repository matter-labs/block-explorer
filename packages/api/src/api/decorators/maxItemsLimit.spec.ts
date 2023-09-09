import { validate } from "class-validator";
import { MaxItemsLimit } from "./maxItemsLimit";

const maxItemsLimit = 30;

class TestPaginationOpts {
  constructor(page: number, offset: number) {
    this.page = page;
    this.offset = offset;
  }

  @MaxItemsLimit(maxItemsLimit, {
    message: `Only first ${maxItemsLimit} items can be requested.`,
  })
  public page = 1;

  public offset = 10;
}

describe("MaxItemsLimit", () => {
  it("does not generate errors if the number of requested items does not exceed the configured limit", async () => {
    const paginationOptions = new TestPaginationOpts(1, 10);
    const result = await validate(paginationOptions);
    expect(result.length).toBe(0);
  });

  it("generates validation error if the number of requested items exceeds the configured limit", async () => {
    const paginationOptions = new TestPaginationOpts(10, 10);
    const result = await validate(paginationOptions);
    expect(result.length).toBe(1);
    expect(result[0].property).toBe("page");
    expect(result[0].constraints?.maxItemsLimit).toBe("Only first 30 items can be requested.");
  });
});
