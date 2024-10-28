import { computed } from "vue";

import { afterEach, describe, expect, it, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import useAddress from "@/composables/useAddress";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(async (url: string) => {
      if (url.includes("contract_verification")) {
        return {
          artifacts: { abi: "abi" },
        };
      }
      return {
        address: url.split("/").pop(),
        balances: {},
        type: url.endsWith("a") ? "account" : "contract",
      };
    }),
  };
});

const mockContractImplementation = vi.fn().mockResolvedValue("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a10");

vi.mock("ethers", async () => {
  const actualEthers = await vi.importActual("ethers");
  return {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ...actualEthers,
    Contract: vi.fn().mockReturnValue({
      implementation: () => mockContractImplementation(),
    }),
  };
});

const mockGetStorage = vi.fn().mockResolvedValue("0x000000000000000000000000000000000000000000000000000000000000");

vi.mock("@/composables/useContext", () => {
  return {
    default: () => ({
      currentNetwork: computed(() => ({ verificationApiUrl: "http://verification.url", apiUrl: "http://api2.url" })),
      getL2Provider: vi.fn().mockReturnValue({
        getStorage: (slot: string) => mockGetStorage(slot),
      }),
    }),
  };
});

describe("useAddresses", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("when called on account", () => {
    it("creates useAccount composable", () => {
      const result = useAddress();
      expect(result.isRequestPending).toBeDefined();
      expect(result.isRequestFailed).toBeDefined();
      expect(result.item).toBeDefined();
      expect(result.getByAddress).toBeDefined();
    });
    it("sets isRequestPending to true when request is pending", async () => {
      const { isRequestPending, getByAddress } = useAddress();
      const promise = getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1a");
      expect(isRequestPending.value).toEqual(true);
      await promise;
    });
    it("sets isRequestPending to false when request is finished", async () => {
      const { isRequestPending, getByAddress } = useAddress();
      await getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1a");
      expect(isRequestPending.value).toEqual(false);
    });
    it("sets isRequestFailed to true when request failed", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockRejectedValueOnce(new Error("An error occurred"));
      const { isRequestFailed, getByAddress } = useAddress();
      await getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1a");

      expect(isRequestFailed.value).toEqual(true);
      mock.mockRestore();
    });
  });

  describe("when called on contract", () => {
    it("loads contract verification info and proxy info", async () => {
      const { item, getByAddress } = useAddress();
      await getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c");
      expect($fetch).toBeCalledWith(
        "http://verification.url/contract_verification/info/0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c"
      );
      expect($fetch).toBeCalledWith(
        "http://verification.url/contract_verification/info/0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a10"
      );
      expect(item.value).toEqual({
        address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c",
        balances: {},
        type: "contract",
        verificationInfo: {
          artifacts: { abi: "abi" },
        },
        proxyInfo: {
          implementation: {
            address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a10",
            verificationInfo: {
              artifacts: { abi: "abi" },
            },
          },
        },
      });
    });

    it("doesn't make contract verification request when network has no verificationApiUrl", async () => {
      const currentNetwork = computed(() => ({ apiUrl: "http://api.url" }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { item, getByAddress } = useAddress({ currentNetwork } as any);
      await getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c");
      expect($fetch).toHaveBeenCalledOnce();
      expect($fetch).toHaveBeenCalledWith("http://api.url/address/0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c");
      expect(item.value).toEqual({
        address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c",
        balances: {},
        type: "contract",
        verificationInfo: null,
        proxyInfo: null,
      });
    });

    it("takes proxy implementation contract from implementation function when it exists", async () => {
      const { item, getByAddress } = useAddress();
      await getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c");

      expect(mockContractImplementation).toBeCalledTimes(1);
      expect(item.value).toEqual({
        address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c",
        balances: {},
        type: "contract",
        verificationInfo: {
          artifacts: { abi: "abi" },
        },
        proxyInfo: {
          implementation: {
            address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a10",
            verificationInfo: {
              artifacts: { abi: "abi" },
            },
          },
        },
      });
    });

    describe("when proxy implementation function does not exist", () => {
      it("takes proxy implementation contract from eip1967 implementation storage slot when it exists", async () => {
        mockContractImplementation.mockRejectedValueOnce(new Error("function does not exist"));
        mockGetStorage
          .mockResolvedValueOnce("0x00000000000000000000c31f9d4cbf557b6cf0ad2af66d44c358f7fa7a12")
          .mockResolvedValueOnce("0x000000000000000000000000000000000000000000000000000000000000")
          .mockResolvedValueOnce("0x000000000000000000000000000000000000000000000000000000000000");

        const { item, getByAddress } = useAddress();
        await getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c");

        expect(mockContractImplementation).toBeCalledTimes(1);
        expect(item.value).toEqual({
          address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c",
          balances: {},
          type: "contract",
          verificationInfo: {
            artifacts: { abi: "abi" },
          },
          proxyInfo: {
            implementation: {
              address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a12",
              verificationInfo: {
                artifacts: { abi: "abi" },
              },
            },
          },
        });
      });

      it("takes proxy implementation contract from eip1822 implementation storage slot when it exists", async () => {
        mockContractImplementation.mockRejectedValueOnce(new Error("function does not exist"));
        mockGetStorage
          .mockResolvedValueOnce("0x000000000000000000000000000000000000000000000000000000000000")
          .mockResolvedValueOnce("0x000000000000000000000000000000000000000000000000000000000000")
          .mockResolvedValueOnce("0x00000000000000000000c31f9d4cbf557b6cf0ad2af66d44c358f7fa7a13");

        const { item, getByAddress } = useAddress();
        await getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c");

        expect(mockContractImplementation).toBeCalledTimes(1);
        expect(item.value).toEqual({
          address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c",
          balances: {},
          type: "contract",
          verificationInfo: {
            artifacts: { abi: "abi" },
          },
          proxyInfo: {
            implementation: {
              address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a13",
              verificationInfo: {
                artifacts: { abi: "abi" },
              },
            },
          },
        });
      });

      it("takes proxy implementation contract from beacon contract by eip1967 beacon storage slot when it exists", async () => {
        mockContractImplementation.mockRejectedValueOnce(new Error("function does not exist"));
        mockContractImplementation.mockResolvedValueOnce("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a14");
        mockGetStorage
          .mockResolvedValueOnce("0x000000000000000000000000000000000000000000000000000000000000")
          .mockResolvedValueOnce("0x00000000000000000000c31f9d4cbf557b6cf0ad2af66d44c358f7fa7a13")
          .mockResolvedValueOnce("0x000000000000000000000000000000000000000000000000000000000000");

        const { item, getByAddress } = useAddress();
        await getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c");

        expect(mockContractImplementation).toBeCalledTimes(2);
        expect(item.value).toEqual({
          address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c",
          balances: {},
          type: "contract",
          verificationInfo: {
            artifacts: { abi: "abi" },
          },
          proxyInfo: {
            implementation: {
              address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a14",
              verificationInfo: {
                artifacts: { abi: "abi" },
              },
            },
          },
        });
      });

      it("returns proxyInfo as null when contract is not a proxy", async () => {
        mockContractImplementation.mockRejectedValueOnce(new Error("function does not exist"));
        mockGetStorage
          .mockResolvedValueOnce("0x000000000000000000000000000000000000000000000000000000000000")
          .mockResolvedValueOnce("0x000000000000000000000000000000000000000000000000000000000000")
          .mockResolvedValueOnce("0x000000000000000000000000000000000000000000000000000000000000");

        const { item, getByAddress } = useAddress();
        await getByAddress("0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c");

        expect(mockContractImplementation).toBeCalledTimes(1);
        expect(item.value).toEqual({
          address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c",
          balances: {},
          type: "contract",
          verificationInfo: {
            artifacts: { abi: "abi" },
          },
          proxyInfo: null,
        });
      });
    });
  });
});
