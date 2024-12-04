import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import { ETH_TOKEN_MOCK, useContextMock } from "./../mocks";

import useTransaction, { getTransferNetworkOrigin } from "@/composables/useTransaction";

import type { Context } from "@/composables/useContext";

const hash = "0x011b4d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bce";
const hashPaidByPaymaster = "0x111b4d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bce";

const logs = [
  {
    address: "0x000000000000000000000000000000000000800A",
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000008001",
      "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
    ],
    data: "0x000000000000000000000000000000000000000000000000000314f4b9af9680",
    blockNumber: 1162235,
    transactionHash: hash,
    transactionIndex: 0,
    logIndex: 3,
  },
  {
    address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
      "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
    ],
    data: "0x000000000000000000000000000000000000000000000000000000000000000c",
    blockNumber: 1162235,
    transactionHash: hash,
    transactionIndex: 0,
    logIndex: 2,
  },
  {
    address: "0x000000000000000000000000000000000000800A",
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000008001",
      "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
    ],
    data: "0x00000000000000000000000000000000000000000000000000006a1b51d01246",
    blockNumber: 1162235,
    transactionHash: hash,
    transactionIndex: 0,
    logIndex: 1,
  },
  {
    address: "0x000000000000000000000000000000000000800A",
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
      "0x0000000000000000000000000000000000000000000000000000000000008001",
    ],
    data: "0x00000000000000000000000000000000000000000000000000058c0e5521a346",
    blockNumber: 1162235,
    transactionHash: hash,
    transactionIndex: 0,
    logIndex: 0,
  },
];

vi.mock("ohmyfetch", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const mod = await vi.importActual<typeof import("ohmyfetch")>("ohmyfetch");
  const transactionDetails = {
    hash: "0x011b4d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bce",
    to: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
    from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
    data: "0xa9059cbb00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36000000000000000000000000000000000000000000000000000000000000000c",
    value: "0",
    isL1Originated: false,
    fee: "0x521f303519100",
    nonce: 24,
    blockNumber: 1162235,
    l1BatchNumber: 11014,
    isL1BatchSealed: true,
    blockHash: "0x1fc6a30903866bf91cede9f831e71f2c7ba0dd023ffc044fe469c51b215d950b",
    transactionIndex: 0,
    receivedAt: "2023-02-28T08:42:08.198Z",
    status: "verified",
    commitTxHash: "0xe6a7ed0b6bf1c49f27feae3a71e5ba2aa4abaa6e372524369529946eb61a6936",
    executeTxHash: "0xdd70c8c2f59d88b9970c3b48a1230320f051d4502d0277124db481a42ada5c33",
    proveTxHash: "0x688c20e2106984bb0ccdadecf01e7bf12088b0ba671d888eca8e577ceac0d790",
    gasPrice: "4000",
    gasLimit: "5000",
    gasUsed: "3000",
    gasPerPubdata: "800",
    maxFeePerGas: "7000",
    maxPriorityFeePerGas: "8000",
    error: null,
    revertReason: null,
  };
  return {
    ...mod,
    $fetch: vi.fn((url: string) => {
      if (url.endsWith(`/transactions/${hash}`) || url.endsWith(`/transactions/${hashPaidByPaymaster}`)) {
        return Promise.resolve(transactionDetails);
      }
      if (url.endsWith(`transactions/${hash}/transfers?limit=100&page=1`)) {
        return Promise.resolve({
          items: [
            {
              from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
              to: "0x0000000000000000000000000000000000008001",
              blockNumber: 1162235,
              transactionHash: hash,
              amount: "1561368069251910",
              tokenAddress: ETH_TOKEN_MOCK.l2Address,
              type: "fee",
              fields: null,
              token: ETH_TOKEN_MOCK,
            },
            {
              from: "0x0000000000000000000000000000000000008001",
              to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
              blockNumber: 1162235,
              transactionHash: hash,
              amount: "116665569251910",
              tokenAddress: ETH_TOKEN_MOCK.l2Address,
              type: "refund",
              fields: null,
              token: ETH_TOKEN_MOCK,
            },
            {
              from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
              to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
              blockNumber: 1162235,
              transactionHash: hash,
              amount: "1",
              tokenAddress: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47D",
              type: "transfer",
              fields: null,
              token: null,
            },
            {
              from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
              to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
              blockNumber: 1162235,
              transactionHash: hash,
              amount: "12",
              tokenAddress: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
              type: "transfer",
              fields: null,
              token: {
                l2Address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
                l1Address: null,
                symbol: "YourTokenSymbol",
                name: "Your Token Name",
                decimals: 18,
              },
            },
            {
              from: "0x0000000000000000000000000000000000008001",
              to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
              blockNumber: 1162235,
              transactionHash: hash,
              amount: "867466250000000",
              tokenAddress: ETH_TOKEN_MOCK.l2Address,
              type: "refund",
              fields: null,
              token: ETH_TOKEN_MOCK,
            },
          ],
          meta: {
            totalItems: 4,
            itemCount: 4,
            itemsPerPage: 100,
            totalPages: 1,
            currentPage: 1,
          },
          links: {
            first: `transactions/${hash}/transfers?limit=100`,
            previous: "",
            next: "",
            last: `transactions/${hash}/transfers?page=1&limit=100`,
          },
        });
      }
      if (url.endsWith(`transactions/${hashPaidByPaymaster}/transfers?limit=100&page=1`)) {
        return Promise.resolve({
          items: [
            {
              from: "0x18d211E22dB19741FF25838A22e4e696FeE7eD36",
              to: "0x0000000000000000000000000000000000008001",
              blockNumber: 1162235,
              transactionHash: hashPaidByPaymaster,
              amount: "1561368069251910",
              tokenAddress: ETH_TOKEN_MOCK.l2Address,
              type: "fee",
              fields: null,
              token: ETH_TOKEN_MOCK,
            },
            {
              from: "0x0000000000000000000000000000000000008001",
              to: "0x18d211E22dB19741FF25838A22e4e696FeE7eD36",
              blockNumber: 1162235,
              transactionHash: hashPaidByPaymaster,
              amount: "116665569251910",
              tokenAddress: ETH_TOKEN_MOCK.l2Address,
              type: "refund",
              fields: null,
              token: ETH_TOKEN_MOCK,
            },
          ],
          meta: {
            totalItems: 2,
            itemCount: 2,
            itemsPerPage: 100,
            totalPages: 1,
            currentPage: 1,
          },
          links: {
            first: `transactions/${hashPaidByPaymaster}/transfers?limit=100`,
            previous: "",
            next: "",
            last: `transactions/${hashPaidByPaymaster}/transfers?page=1&limit=100`,
          },
        });
      }
      if (url.includes("/logs?limit=100&page=1")) {
        return Promise.resolve({
          items: logs,
          meta: {
            totalItems: 4,
            itemCount: 4,
            itemsPerPage: 100,
            totalPages: 1,
            currentPage: 1,
          },
          links: {
            first: `transactions/${hash}/logs?limit=100`,
            previous: "",
            next: "",
            last: `transactions/${hash}/logs?page=1&limit=100`,
          },
        });
      }

      if (url.includes("/0x00000d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bcf")) {
        const error = new mod.FetchError("Not found");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).response = { status: 404 };
        return Promise.reject(error);
      }
    }),
  };
});

describe("useTransaction:", () => {
  let mockContext: SpyInstance;

  beforeEach(() => {
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
  });

  it("creates useTransaction composable", () => {
    const result = useTransaction();
    expect(result.transaction).toBeDefined();
    expect(result.isRequestPending).toBeDefined();
    expect(result.isRequestFailed).toBeDefined();
  });

  describe("getTransferNetworkOrigin:", () => {
    it("returns L2 when sender is 'to' and type is 'transfer'", () => {
      const result = getTransferNetworkOrigin(
        {
          tokenInfo: {
            l1Address: "0x63bfb2118771bd0da7a6936667a7bb705a06c1ba",
            l2Address: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
            address: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
            symbol: "LINK",
            name: "ChainLink Token (testnet)",
            decimals: 18,
            usdPrice: 1,
          },
          from: "0xcfa3dd0cba60484d1c8d0cdd22c5432013368875",
          to: "0xde03a0b5963f75f1c8485b355ff6d30f3093bde7",
          amount: "0x2279f530c00",
          type: "transfer",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        "from"
      );
      expect(result).toBe("L2");
    });

    it("returns L1 when sender is 'form' and type is 'deposit'", () => {
      const result = getTransferNetworkOrigin(
        {
          tokenInfo: {
            l1Address: "0x63bfb2118771bd0da7a6936667a7bb705a06c1ba",
            l2Address: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
            address: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
            symbol: "LINK",
            name: "ChainLink Token (testnet)",
            decimals: 18,
            usdPrice: 1,
          },
          from: "0xcfa3dd0cba60484d1c8d0cdd22c5432013368875",
          to: "0xde03a0b5963f75f1c8485b355ff6d30f3093bde7",
          amount: "0x2279f530c00",
          type: "deposit",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        "from"
      );
      expect(result).toBe("L1");
    });

    it("returns L2 when sender is 'form' and type is 'fee'", () => {
      const result = getTransferNetworkOrigin(
        {
          tokenInfo: {
            l1Address: "0x63bfb2118771bd0da7a6936667a7bb705a06c1ba",
            l2Address: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
            address: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
            symbol: "LINK",
            name: "ChainLink Token (testnet)",
            decimals: 18,
            usdPrice: 1,
          },
          from: "0xcfa3dd0cba60484d1c8d0cdd22c5432013368875",
          to: "0xde03a0b5963f75f1c8485b355ff6d30f3093bde7",
          amount: "0x2279f530c00",
          type: "fee",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        "from"
      );
      expect(result).toEqual("L2");
    });
  });
  describe("getByHash:", () => {
    it("sets isRequestPending to true when request is pending", async () => {
      const { isRequestPending, getByHash } = useTransaction();

      const promise = getByHash(hash);

      expect(isRequestPending.value).toEqual(true);
      await promise;
    });
    it("sets isRequestPending to false when request is completed", async () => {
      const { isRequestPending, getByHash } = useTransaction();
      await getByHash(hash);
      expect(isRequestPending.value).toEqual(false);
    });
    it("sets isRequestFailed to true when request failed", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockRejectedValue(new Error("An error occurred"));
      const { isRequestFailed, getByHash } = useTransaction();
      await getByHash(hash);

      expect(isRequestFailed.value).toEqual(true);
      mock.mockRestore();
    });
    it("sets transaction to null and failed to false when request fails with status code 404", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error: any = new FetchError("404");
      error.response = {
        status: 404,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockRejectedValue(error);
      const { transaction, isRequestFailed, getByHash } = useTransaction();
      await getByHash(hash);

      expect(transaction.value).toEqual(null);
      expect(isRequestFailed.value).toEqual(false);
      mock.mockRestore();
    });
    it("requests data successfully", async () => {
      const { transaction, isRequestFailed, getByHash } = useTransaction();
      await getByHash(hash);

      expect(isRequestFailed.value).toEqual(false);
      expect(transaction.value).toEqual({
        hash,
        blockHash: "0x1fc6a30903866bf91cede9f831e71f2c7ba0dd023ffc044fe469c51b215d950b",
        blockNumber: 1162235,
        data: {
          contractAddress: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
          calldata:
            "0xa9059cbb00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36000000000000000000000000000000000000000000000000000000000000000c",
          sighash: "0xa9059cbb",
          value: "0",
        },
        value: "0",
        from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
        to: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
        ethCommitTxHash: "0xe6a7ed0b6bf1c49f27feae3a71e5ba2aa4abaa6e372524369529946eb61a6936",
        ethExecuteTxHash: "0xdd70c8c2f59d88b9970c3b48a1230320f051d4502d0277124db481a42ada5c33",
        ethProveTxHash: "0x688c20e2106984bb0ccdadecf01e7bf12088b0ba671d888eca8e577ceac0d790",
        fee: "0x521f303519100",
        feeData: {
          amountPaid: "0x521f303519100",
          paymasterAddress: undefined,
          isPaidByPaymaster: false,
          refunds: [
            {
              amount: "116665569251910",
              from: "0x0000000000000000000000000000000000008001",
              to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
              fromNetwork: "L2",
              toNetwork: "L2",
              type: "refund",
              tokenInfo: {
                address: "0x000000000000000000000000000000000000800A",
                l1Address: "0x0000000000000000000000000000000000000000",
                l2Address: "0x000000000000000000000000000000000000800A",
                symbol: "ETH",
                name: "Ether",
                decimals: 18,
                iconURL: null,
                liquidity: 220000000000,
                usdPrice: 1800,
              },
            },
            {
              amount: "867466250000000",
              from: "0x0000000000000000000000000000000000008001",
              to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
              fromNetwork: "L2",
              toNetwork: "L2",
              type: "refund",
              tokenInfo: {
                address: "0x000000000000000000000000000000000000800A",
                l1Address: "0x0000000000000000000000000000000000000000",
                l2Address: "0x000000000000000000000000000000000000800A",
                symbol: "ETH",
                name: "Ether",
                decimals: 18,
                iconURL: null,
                liquidity: 220000000000,
                usdPrice: 1800,
              },
            },
          ],
          amountRefunded: "0x37f100b7fa8c6",
        },
        indexInBlock: 0,
        isL1Originated: false,
        nonce: 24,
        receivedAt: "2023-02-28T08:42:08.198Z",
        status: "verified",
        error: null,
        revertReason: null,
        l1BatchNumber: 11014,
        isL1BatchSealed: true,
        logs: [
          {
            address: "0x000000000000000000000000000000000000800A",
            blockNumber: 1162235,
            data: "0x000000000000000000000000000000000000000000000000000314f4b9af9680",
            logIndex: "3",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x0000000000000000000000000000000000000000000000000000000000008001",
              "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
            ],
            transactionHash: hash,
            transactionIndex: "0",
          },
          {
            address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
            blockNumber: 1162235,
            data: "0x000000000000000000000000000000000000000000000000000000000000000c",
            logIndex: "2",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
              "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
            ],
            transactionHash: hash,
            transactionIndex: "0",
          },
          {
            address: "0x000000000000000000000000000000000000800A",
            blockNumber: 1162235,
            data: "0x00000000000000000000000000000000000000000000000000006a1b51d01246",
            logIndex: "1",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x0000000000000000000000000000000000000000000000000000000000008001",
              "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
            ],
            transactionHash: hash,
            transactionIndex: "0",
          },
          {
            address: "0x000000000000000000000000000000000000800A",
            blockNumber: 1162235,
            data: "0x00000000000000000000000000000000000000000000000000058c0e5521a346",
            logIndex: "0",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
              "0x0000000000000000000000000000000000000000000000000000000000008001",
            ],
            transactionHash: hash,
            transactionIndex: "0",
          },
        ],
        transfers: [
          {
            amount: "1",
            from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
            to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
            fromNetwork: "L2",
            toNetwork: "L2",
            type: "transfer",
            tokenInfo: {
              iconURL: undefined,
              liquidity: undefined,
              usdPrice: undefined,
              address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47D",
              l1Address: undefined,
              l2Address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47D",
              decimals: 0,
              name: undefined,
              symbol: undefined,
            },
          },
          {
            amount: "12",
            from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
            to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
            fromNetwork: "L2",
            toNetwork: "L2",
            type: "transfer",
            tokenInfo: {
              iconURL: undefined,
              liquidity: undefined,
              usdPrice: undefined,
              address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
              l1Address: null,
              l2Address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
              decimals: 18,
              name: "Your Token Name",
              symbol: "YourTokenSymbol",
            },
          },
        ],
        gasPrice: "4000",
        gasLimit: "5000",
        gasUsed: "3000",
        gasPerPubdata: "800",
        maxFeePerGas: "7000",
        maxPriorityFeePerGas: "8000",
      });
    });
    it("adds paymaster fields to fee data when transaction is paid by paymaster", async () => {
      const { transaction, isRequestFailed, getByHash } = useTransaction();
      await getByHash(hashPaidByPaymaster);

      expect(isRequestFailed.value).toEqual(false);
      expect(transaction.value?.feeData).toEqual({
        amountPaid: "0x521f303519100",
        isPaidByPaymaster: true,
        paymasterAddress: "0x18d211E22dB19741FF25838A22e4e696FeE7eD36",
        refunds: [
          {
            amount: "116665569251910",
            from: "0x0000000000000000000000000000000000008001",
            to: "0x18d211E22dB19741FF25838A22e4e696FeE7eD36",
            fromNetwork: "L2",
            toNetwork: "L2",
            type: "refund",
            tokenInfo: {
              address: "0x000000000000000000000000000000000000800A",
              l1Address: "0x0000000000000000000000000000000000000000",
              l2Address: "0x000000000000000000000000000000000000800A",
              symbol: "ETH",
              name: "Ether",
              decimals: 18,
              iconURL: null,
              liquidity: 220000000000,
              usdPrice: 1800,
            },
          },
        ],
        amountRefunded: "0x6a1b51d01246",
      });
    });
    describe("when transaction request fails with not found error", () => {
      it("fetches transaction data directly from blockchain", async () => {
        const provider = {
          getTransaction: vi.fn().mockResolvedValue({
            hash: "0x00000d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bcf",
            blockHash: "0x1fc6a30903866bf91cede9f831e71f2c7ba0dd023ffc044fe469c51b215d950b",
            blockNumber: 1162235,
            to: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
            from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
            data: "0xa9059cbb00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36000000000000000000000000000000000000000000000000000000000000000c",
            value: "0",
            nonce: 24,
            l1BatchNumber: 11014,
            gasPrice: "4000",
            gasLimit: "5000",
            maxFeePerGas: "7000",
            maxPriorityFeePerGas: "8000",
          }),
          getTransactionDetails: vi.fn().mockResolvedValue({
            status: "verified",
            ethCommitTxHash: "0xe6a7ed0b6bf1c49f27feae3a71e5ba2aa4abaa6e372524369529946eb61a6936",
            ethExecuteTxHash: "0xdd70c8c2f59d88b9970c3b48a1230320f051d4502d0277124db481a42ada5c33",
            ethProveTxHash: "0x688c20e2106984bb0ccdadecf01e7bf12088b0ba671d888eca8e577ceac0d790",
            fee: "0x521f303519100",
            isL1Originated: false,
            receivedAt: "2023-02-28T08:42:08.198Z",
            gasPerPubdata: "0x320",
          }),
          getTransactionReceipt: vi.fn().mockResolvedValue({
            index: 0,
            logs: logs.map((log) => ({ ...log, index: log.logIndex })),
            gasUsed: "3000",
          }),
        };
        const { transaction, isRequestFailed, getByHash } = useTransaction({
          currentNetwork: {
            value: {
              apiUrl: "http://api.url",
            },
          },
          getL2Provider: vi.fn().mockReturnValue(provider),
        } as unknown as Context);

        await getByHash("0x00000d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bcf");

        expect(provider.getTransaction).toBeCalledWith(
          "0x00000d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bcf"
        );
        expect(provider.getTransactionDetails).toBeCalledWith(
          "0x00000d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bcf"
        );
        expect(provider.getTransactionReceipt).toBeCalledWith(
          "0x00000d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bcf"
        );

        expect(isRequestFailed.value).toBe(false);
        expect(transaction.value).toEqual({
          hash: "0x00000d03dd8c01f1049143cf9c4c817e4b167f1d1b83e5c6f0f10d89ba1e7bcf",
          blockHash: "0x1fc6a30903866bf91cede9f831e71f2c7ba0dd023ffc044fe469c51b215d950b",
          blockNumber: 1162235,
          data: {
            contractAddress: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
            calldata:
              "0xa9059cbb00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36000000000000000000000000000000000000000000000000000000000000000c",
            sighash: "0xa9059cbb",
            value: "0",
          },
          value: "0",
          from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
          to: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
          ethCommitTxHash: "0xe6a7ed0b6bf1c49f27feae3a71e5ba2aa4abaa6e372524369529946eb61a6936",
          ethExecuteTxHash: "0xdd70c8c2f59d88b9970c3b48a1230320f051d4502d0277124db481a42ada5c33",
          ethProveTxHash: "0x688c20e2106984bb0ccdadecf01e7bf12088b0ba671d888eca8e577ceac0d790",
          fee: "0x521f303519100",
          feeData: {
            amountPaid: "0x521f303519100",
            isPaidByPaymaster: false,
            refunds: [],
            amountRefunded: "0x0",
          },
          indexInBlock: 0,
          isL1Originated: false,
          nonce: 24,
          receivedAt: "2023-02-28T08:42:08.198Z",
          status: "indexing",
          l1BatchNumber: 11014,
          isL1BatchSealed: false,
          logs: [
            {
              address: "0x000000000000000000000000000000000000800A",
              blockNumber: 1162235,
              data: "0x000000000000000000000000000000000000000000000000000314f4b9af9680",
              logIndex: "3",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x0000000000000000000000000000000000000000000000000000000000008001",
                "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
              ],
              transactionHash: hash,
              transactionIndex: "0",
            },
            {
              address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
              blockNumber: 1162235,
              data: "0x000000000000000000000000000000000000000000000000000000000000000c",
              logIndex: "2",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
                "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
              ],
              transactionHash: hash,
              transactionIndex: "0",
            },
            {
              address: "0x000000000000000000000000000000000000800A",
              blockNumber: 1162235,
              data: "0x00000000000000000000000000000000000000000000000000006a1b51d01246",
              logIndex: "1",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x0000000000000000000000000000000000000000000000000000000000008001",
                "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
              ],
              transactionHash: hash,
              transactionIndex: "0",
            },
            {
              address: "0x000000000000000000000000000000000000800A",
              blockNumber: 1162235,
              data: "0x00000000000000000000000000000000000000000000000000058c0e5521a346",
              logIndex: "0",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
                "0x0000000000000000000000000000000000000000000000000000000000008001",
              ],
              transactionHash: hash,
              transactionIndex: "0",
            },
          ],
          transfers: [],
          gasPrice: "4000",
          gasLimit: "5000",
          gasUsed: "3000",
          gasPerPubdata: "800",
          maxFeePerGas: "7000",
          maxPriorityFeePerGas: "8000",
        });
      });
    });
  });
});
