import { unixTimeToDate, unixTimeToDateString } from "./date";

describe("unixTimeToDate", () => {
  it("formats unix time to Date", () => {
    const date = new Date();
    expect(unixTimeToDate(date.getTime() / 1000)).toEqual(date);
  });
});

describe("unixTimeToDateString", () => {
  it("formats unix time to ISO string", () => {
    const date = new Date();
    expect(unixTimeToDateString(date.getTime() / 1000)).toEqual(date.toISOString());
  });
});
