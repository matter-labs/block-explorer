import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { useContextMock } from "./../mocks";

import useNetworkStats, { type NetworkStats } from "@/composables/useNetworkStats";

import type { UseFetch } from "@/composables/common/useFetch";
import type { SpyInstance } from "vitest";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => new Promise((resolve) => setImmediate(resolve))),
  };
});

describe("UseNetworkStats:", () => {
  /* eslint-disable  @typescript-eslint/no-explicit-any */

  let mockContext: SpyInstance;
  let composable: UseFetch<NetworkStats>;
  beforeEach(() => {
    mockContext = useContextMock();

    composable = useNetworkStats();
  });

  afterEach(() => {
    mockContext?.mockRestore();
  });

  const expectedValue: NetworkStats = {
    lastSealedBlock: 15,
    lastVerifiedBlock: 15,
    totalTransactions: 15,
    lastSealedBatch: 15,
    lastVerifiedBatch: 15,
  };

  it("creates useNetworkStats composable", () => {
    expect(composable.fetch).toBeDefined();
    expect(composable.pending).toBeDefined();
    expect(composable.failed).toBeDefined();
    expect(composable.item).toBeDefined();
  });

  it("gets network stats from API", async () => {
    const mock = ($fetch as any).mockResolvedValue(expectedValue);

    await composable.fetch();
    const networkStats = composable.item;
    expect(networkStats.value?.lastSealedBlock).toBe(15);
    expect(networkStats.value?.lastVerifiedBlock).toBe(15);
    expect(networkStats.value?.totalTransactions).toBe(15);
    mock.mockRestore();
  });

  it("sets pending to true when request pending", async () => {
    const promise = composable.fetch();

    expect(composable.pending.value).toEqual(true);
    await promise;
  });

  it("sets pending to false when request completed", async () => {
    await composable.fetch();

    expect(composable.pending.value).toEqual(false);
  });

  it("sets failed to false when request completed", async () => {
    const mock = ($fetch as any).mockResolvedValue(expectedValue);

    await composable.fetch();

    expect(composable.failed.value).toEqual(false);
    mock.mockRestore();
  });

  it("sets failed to true when request failed", async () => {
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.fetch();

    expect(composable.failed.value).toEqual(true);
    mock.mockRestore();
  });

  it("sets networkStats to null when request failed", async () => {
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.fetch();

    expect(composable.item.value).toEqual(null);
    mock.mockRestore();
  });
});
