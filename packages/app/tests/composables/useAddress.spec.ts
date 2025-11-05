import { computed } from "vue";

import { afterEach, describe, expect, it, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import useAddress from "@/composables/useAddress";

import type { SpyInstance } from "vitest";

vi.mock("ohmyfetch", () => {
  const fetchSpy = vi.fn(async (url: string) => {
    if (url.includes("action=getsourcecode")) {
      return {
        status: "1",
        result: [
          {
            ABI: "[]",
            SourceCode:
              '{{"language":"Solidity","settings":{"optimizer":{"enabled":true,"runs":200},"evmVersion":"istanbul","libraries":{}},"sources":{"DARA2.sol":{"content":"\\n}"}}}}',
            CompilerVersion: "v0.8.16+commit.07a7930e",
            ContractName: "DARA2",
            OptimizationUsed: "1",
            Runs: "200",
            ConstructorArguments: "",
            EVMVersion: "istanbul",
            Implementation: "",
            Proxy: "0",
            Library: "",
            LicenseType: "Unknown",
            SwarmSource: "",
            VerifiedAt: "2022-09-23T11:36:07.988424532Z",
            Match: "match",
          },
        ],
      };
    }
    return {
      address: url.slice(url.length - 42),
      balances: {},
      type: url.endsWith("a") ? "account" : "contract",
    };
  });
  (fetchSpy as unknown as { create: SpyInstance }).create = vi.fn(() => fetchSpy);
  return {
    $fetch: fetchSpy,
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

const mappedVerificationInfo = {
  abi: [],
  compilation: {
    compilerSettings: {
      evmVersion: "istanbul",
      libraries: {},
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    compilerVersion: "v0.8.16+commit.07a7930e",
    fullyQualifiedName: "DARA2",
    language: "Solidity",
  },
  sources: { "DARA2.sol": { content: "\n}" } },
  match: "match",
  verifiedAt: "2022-09-23T11:36:07.988424532Z",
};

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
        "?module=contract&action=getsourcecode&address=0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c"
      );
      expect($fetch).toBeCalledWith(
        "?module=contract&action=getsourcecode&address=0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a10"
      );
      expect(item.value).toEqual({
        address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c",
        balances: {},
        type: "contract",
        verificationInfo: mappedVerificationInfo,
        proxyInfo: {
          implementation: {
            address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a10",
            verificationInfo: mappedVerificationInfo,
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
      expect($fetch).toHaveBeenCalledWith("/address/0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a1c");
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
        verificationInfo: mappedVerificationInfo,
        proxyInfo: {
          implementation: {
            address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a10",
            verificationInfo: mappedVerificationInfo,
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
          verificationInfo: mappedVerificationInfo,
          proxyInfo: {
            implementation: {
              address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a12",
              verificationInfo: mappedVerificationInfo,
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
          verificationInfo: mappedVerificationInfo,
          proxyInfo: {
            implementation: {
              address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a13",
              verificationInfo: mappedVerificationInfo,
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
          verificationInfo: mappedVerificationInfo,
          proxyInfo: {
            implementation: {
              address: "0xc31f9d4cbf557b6cf0ad2af66d44c358f7fa7a14",
              verificationInfo: mappedVerificationInfo,
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
          verificationInfo: mappedVerificationInfo,
          proxyInfo: null,
        });
      });
    });
  });
});
