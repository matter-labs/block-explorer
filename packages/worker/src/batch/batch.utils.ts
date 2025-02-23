import { types } from "zksync-ethers";
import { BatchState } from "../entities/batch.entity";

export const getBatchState = (batch: types.BatchDetails): BatchState => {
  if (batch.executedAt) {
    return BatchState.Executed;
  }
  if (batch.provenAt) {
    return BatchState.Proven;
  }
  if (batch.committedAt) {
    return BatchState.Committed;
  }
  return BatchState.New;
};
