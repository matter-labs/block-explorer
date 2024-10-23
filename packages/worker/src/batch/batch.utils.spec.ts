import { types } from "zksync-ethers";
import { BatchState } from "../entities/batch.entity";
import { getBatchState } from "./batch.utils";

describe("getBatchState", () => {
  it("returns Executed when batch has executedAt", () => {
    expect(
      getBatchState({
        executedAt: new Date(),
        provenAt: new Date(),
        committedAt: new Date(),
      } as types.BatchDetails)
    ).toBe(BatchState.Executed);
  });

  it("returns Proven when batch has provenAt", () => {
    expect(
      getBatchState({
        executedAt: null,
        provenAt: new Date(),
        committedAt: new Date(),
      } as types.BatchDetails)
    ).toBe(BatchState.Proven);
  });

  it("returns Committed when batch has committedAt", () => {
    expect(
      getBatchState({
        executedAt: null,
        provenAt: null,
        committedAt: new Date(),
      } as types.BatchDetails)
    ).toBe(BatchState.Committed);
  });

  it("returns New when batch has no executedAt, committedAt or committedAt", () => {
    expect(
      getBatchState({
        executedAt: null,
        provenAt: null,
        committedAt: null,
      } as types.BatchDetails)
    ).toBe(BatchState.New);
  });
});
