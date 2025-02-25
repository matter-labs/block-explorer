import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import { useContextMock } from "./../mocks";

import useContractEvents, { type EventsQueryParams } from "@/composables/useContractEvents";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() =>
      Promise.resolve({
        items: [
          {
            address: "0x2E4805d59193E173C9C8125B4Fc8F7f9c7a3a3eD",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x0000000000000000000000000d32e1ed81cd918a1099fa9e9f2455e422fd8819",
              "0x000000000000000000000000b54cde2bf3cb660f58a89114c701164bddcd0d3c",
            ],
            data: "0x00000000000000000000000000000000000000000000001043561a8829300000",
            blockNumber: 1,

            transactionHash: "0x770a13d5d056d8d63ab6339265ca9bcf7bc73cb6475de438d79119c9cdc1d2de",
            transactionIndex: 1,
            logIndex: 3,
          },
        ],
        meta: {
          currentPage: 1,
          itemCount: 1,
          itemsPerPage: 1,
          totalItems: 1000,
          totalPages: 1000,
        },
        links: {},
      })
    ),
    FetchError: function error() {
      return;
    },
  };
});

describe("useContractEvents:", () => {
  let mockContext: SpyInstance;

  beforeEach(() => {
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
  });

  const params: EventsQueryParams = {
    contractAddress: "0x2E4805d59193E173C9C8125B4Fc8F7f9c7a3a3eD",
    page: 1,
    pageSize: 1,
  };

  it("creates useContractEvents composable", () => {
    const result = useContractEvents();
    expect(result.total).toBeDefined();
    expect(result.collection).toBeDefined();
    expect(result.getCollection).toBeDefined();
    expect(result.isRequestFailed).toBeDefined();
    expect(result.isRequestPending).toBeDefined();
  });
  it("sets isRequestPending to true when request is pending", async () => {
    const { isRequestPending, getCollection } = useContractEvents();
    const promise = getCollection(params);
    expect(isRequestPending.value).toEqual(true);
    await promise;
  });
  it("sets isRequestPending to false when request is completed", async () => {
    const { isRequestPending, getCollection } = useContractEvents();
    await getCollection(params);
    expect(isRequestPending.value).toEqual(false);
  });
  it("sets isRequestFailed to true when request is failed", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockRejectedValue(new FetchError("An error occurred"));
    const { isRequestFailed, getCollection } = useContractEvents();
    await getCollection(params);
    expect(isRequestFailed.value).toEqual(true);
    mock.mockRestore();
  });
  it("gets collection successfully", async () => {
    const { getCollection, collection } = useContractEvents();
    await getCollection(params);

    expect(collection.value).toEqual([
      {
        address: "0x2E4805d59193E173C9C8125B4Fc8F7f9c7a3a3eD",
        blockNumber: BigInt(1),
        data: "0x00000000000000000000000000000000000000000000001043561a8829300000",
        event: undefined,
        logIndex: "3",
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000d32e1ed81cd918a1099fa9e9f2455e422fd8819",
          "0x000000000000000000000000b54cde2bf3cb660f58a89114c701164bddcd0d3c",
        ],
        transactionHash: "0x770a13d5d056d8d63ab6339265ca9bcf7bc73cb6475de438d79119c9cdc1d2de",
        transactionIndex: "1",
      },
    ]);
  });
  it("gets total successfully", async () => {
    const { getCollection, total } = useContractEvents();
    await getCollection(params);

    expect(total.value).toEqual(1000);
  });

  it("sets known request params", async () => {
    ($fetch as unknown as SpyInstance).mockClear();
    const { getCollection } = useContractEvents();
    await getCollection(params);

    expect($fetch).toHaveBeenCalledWith(
      "https://block-explorer-api.testnets.zksync.dev/address/0x2E4805d59193E173C9C8125B4Fc8F7f9c7a3a3eD/logs?page=1&limit=1"
    );
  });
});
