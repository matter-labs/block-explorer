import { describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import useEventLog, { type TransactionLogEntry } from "@/composables/useEventLog";

import ERC20VerificationInfo from "@/../mock/contracts/ERC20VerificationInfo.json";

import type { Address } from "@/types";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => Promise.resolve(ERC20VerificationInfo)),
    FetchError: function error() {
      return;
    },
  };
});

const eventLogs = [
  {
    address: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
    data: "0x000000000000000000000000000000000000000000000000000002279f530c00",
    event: undefined,
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x000000000000000000000000cfa3dd0cba60484d1c8d0cdd22c5432013368875",
      "0x000000000000000000000000de03a0b5963f75f1c8485b355ff6d30f3093bde7",
    ],
  },
] as unknown as TransactionLogEntry[];

describe("useEventLog:", () => {
  it("creates useEventLog composable", () => {
    const result = useEventLog();
    expect(result.collection).toBeDefined();
    expect(result.isDecodePending).toBeDefined();
    expect(result.isDecodeFailed).toBeDefined();
    expect(result.decodeEventLog).toBeDefined();
  });
  it("sets isDecodePending to true when decode event log is pending", async () => {
    const { isDecodePending, decodeEventLog } = useEventLog();
    const promise = decodeEventLog(eventLogs);
    expect(isDecodePending.value).toEqual(true);
    await promise;
  });
  it("sets isDecodePending to false when decode event log is completed", async () => {
    const { isDecodePending, decodeEventLog } = useEventLog();
    await decodeEventLog(eventLogs);
    expect(isDecodePending.value).toEqual(false);
  });
  it("returns raw logs in case account request failed", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockRejectedValue(new Error("An error occurred"));
    const { collection, isDecodePending, isDecodeFailed, decodeEventLog } = useEventLog();
    const logWithNewAddress = [
      {
        ...eventLogs[0],
        address: "0x1232c03b2cf6ede46500e799de79a15df44929eb" as Address,
      },
    ];
    await decodeEventLog(logWithNewAddress);
    expect(isDecodePending.value).toEqual(false);
    expect(isDecodeFailed.value).toEqual(true);
    expect(collection.value).toEqual(logWithNewAddress);
    mock.mockRestore();
  });
  it("decodes logs successfully", async () => {
    const { collection, isDecodePending, isDecodeFailed, decodeEventLog } = useEventLog();
    await decodeEventLog(eventLogs);
    expect(isDecodePending.value).toEqual(false);
    expect(isDecodeFailed.value).toEqual(false);
    expect(collection.value).toEqual(eventLogs);
  });
});
