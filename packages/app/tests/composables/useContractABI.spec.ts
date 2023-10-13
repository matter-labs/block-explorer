import { computed, ref } from "vue";

import { describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { GOERLI_BETA_NETWORK, GOERLI_NETWORK } from "../mocks";

import useContractABI from "@/composables/useContractABI";

const contractVerificationInfo = {
  artifacts: {
    abi: [
      {
        inputs: [],
        stateMutability: "nonpayable",
        type: "constructor",
      },
    ],
  },
  request: {
    contractAddress: "0x0000000000000000000000000000000000000000",
  },
};

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => Promise.resolve(contractVerificationInfo)),
    FetchError: function error() {
      return;
    },
  };
});

describe("useContractABI:", () => {
  it("creates useContractABI composable", () => {
    const result = useContractABI();
    expect(result.isRequestPending).toBeDefined();
    expect(result.isRequestFailed).toBeDefined();
    expect(result.collection).toBeDefined();
    expect(result.getCollection).toBeDefined();
  });
  it("sets value from request to collection", async () => {
    const { collection, getCollection } = useContractABI();
    await getCollection(["0x0000000000000000000000000000000000000000"]);
    expect(collection.value).toEqual({
      "0x0000000000000000000000000000000000000000": contractVerificationInfo.artifacts.abi,
    });
  });
  it("sets isRequestPending to true when request is pending", async () => {
    const { isRequestPending, getCollection } = useContractABI();
    const promise = getCollection(["0x0000000000000000000000000000000000000000"]);
    expect(isRequestPending.value).toEqual(true);
    await promise;
  });
  it("sets isRequestPending to false when request is finished", async () => {
    const { isRequestPending, getCollection } = useContractABI();
    await getCollection(["0x0000000000000000000000000000000000000000"]);
    expect(isRequestPending.value).toEqual(false);
  });
  it("sets isRequestFailed to true when request failed", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockRejectedValue(new Error("An error occurred"));
    const { isRequestFailed, getCollection } = useContractABI();
    await getCollection(["0x0000000000000000000000000000000000000123"]);

    expect(isRequestFailed.value).toEqual(true);
    mock.mockRestore();
  });
  it("doesn't make request when there is no verification api url", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockClear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { getCollection } = useContractABI({ currentNetwork: computed(() => ({})) } as any);
    await getCollection(["0x5550000000000000000000000000000000000000"]);
    expect(mock).toHaveBeenCalledTimes(0);
    mock.mockRestore();
  });
  it("caches the results", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockClear();
    const { getCollection } = useContractABI();
    await getCollection(["0x1000000000000000000000000000000000000000"]);
    await getCollection(["0x1000000000000000000000000000000000000000"]);
    expect(mock).toHaveBeenCalledOnce();
    mock.mockRestore();
  });
  it("does not reuse cache if network changed", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockClear();
    const currentNetwork = ref(GOERLI_NETWORK);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { getCollection } = useContractABI({ currentNetwork } as any);
    await getCollection(["0x1230000000000000000000000000000000000000"]);
    currentNetwork.value = GOERLI_BETA_NETWORK;
    await getCollection(["0x1230000000000000000000000000000000000000"]);
    expect(mock).toBeCalledTimes(2);
    mock.mockRestore();
  });
});
