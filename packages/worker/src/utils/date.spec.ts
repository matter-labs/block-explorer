import { unixTimeToDate } from "./date";

describe("unixTimeToDate", () => {
  it("formats unix time to Date", () => {
    const date = new Date();
    expect(unixTimeToDate(date.getTime() / 1000)).toEqual(date);
  });
});
