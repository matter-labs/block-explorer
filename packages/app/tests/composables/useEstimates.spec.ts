import { describe, expect, it } from "vitest";

import useEstimates from "@/composables/useEstimates";

describe("UseEstimates:", () => {
  const composable = useEstimates();

  it("creates useEstimates composable", () => {
    expect(composable.getEstimatedCosts).toBeDefined();
    expect(composable.isRequestPending).toBeDefined();
    expect(composable.isRequestFailed).toBeDefined();
    expect(composable.costs).toBeDefined();
  });

  it("gets estimated costs from API", async () => {
    await composable.getEstimatedCosts();
    const costs = composable.costs;

    expect(costs.value?.length).toBe(4);
    for (const cost of costs.value || []) {
      expect(cost).have.property("label");
      expect(cost).have.property("value");
    }
  });

  it("sets isRequestPending to true when request pending", async () => {
    const promise = composable.getEstimatedCosts();

    expect(composable.isRequestPending.value).toEqual(true);
    await promise;
  });

  it("sets isRequestPending to false when request completed", async () => {
    await composable.getEstimatedCosts();

    expect(composable.isRequestPending.value).toEqual(false);
  });

  it("sets isRequestFailed to false when request completed", async () => {
    await composable.getEstimatedCosts();

    expect(composable.isRequestFailed.value).toEqual(false);
  });
});
