import { BlockData } from "../dataFetcher/types";
import { validateBlocksLinking } from "./block.utils";

describe("validateBlocksLinking", () => {
  it("returns true when all the blocks in the provided list have correct parent hash links", () => {
    expect(
      validateBlocksLinking([
        {
          block: { hash: "hash1", parentHash: "hash0" },
        } as BlockData,
        {
          block: { hash: "hash2", parentHash: "hash1" },
        } as BlockData,
      ])
    ).toBeTruthy();
  });

  it("returns true when provided list has only 1 block", () => {
    expect(
      validateBlocksLinking([
        {
          block: { hash: "hash1" },
        } as BlockData,
      ])
    ).toBeTruthy();
  });

  it("returns true when provided list is empty", () => {
    expect(validateBlocksLinking([])).toBeTruthy();
  });

  it("returns false when at list 1 block in the provided list has invalid parent hash link", () => {
    expect(
      validateBlocksLinking([
        {
          block: { hash: "hash1", parentHash: "hash0" },
        } as BlockData,
        {
          block: { hash: "hash2", parentHash: "hash1" },
        } as BlockData,
        {
          block: { hash: "hash3", parentHash: "hash1" },
        } as BlockData,
      ])
    ).toBeFalsy();
  });
});
