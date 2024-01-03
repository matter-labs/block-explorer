import splitIntoChunks from "./splitIntoChunks";

describe("splitIntoChunks", () => {
  it("splits array into chunks", () => {
    const chunks = splitIntoChunks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
  });

  it("splits array into chunks with size 10 by default", () => {
    const chunks = splitIntoChunks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(chunks).toEqual([
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [11, 12],
    ]);
  });
});
