import { computed } from "vue";

import { afterEach, describe, expect, it, vi } from "vitest";

let location = {
  origin: "https://zkscan2.io",
  search: "",
};

vi.mock("@/utils/helpers", () => ({
  getWindowLocation: () => location,
}));

import { TESTNET_BETA_NETWORK, TESTNET_NETWORK } from "../mocks";

import * as useContext from "@/composables/useContext";
import * as useEnvironmentConfig from "@/composables/useEnvironmentConfig";
import { DEFAULT_NETWORK } from "@/composables/useRuntimeConfig";

describe("useContext:", () => {
  describe("correctly indentifies network:", () => {
    afterEach(() => {
      location = {
        origin: "",
        search: "",
      };
    });

    describe("networks:", () => {
      it("returns environment networks", () => {
        const mockEnvironmentConfig = vi.spyOn(useEnvironmentConfig, "default").mockReturnValue({
          networks: computed(() => [TESTNET_NETWORK, TESTNET_BETA_NETWORK]),
          baseTokenAddress: computed(() => "0x000000000000000000000000000000000000800A"),
        });
        const context = useContext.default();
        expect(context.networks.value).toEqual([TESTNET_NETWORK, TESTNET_BETA_NETWORK]);
        mockEnvironmentConfig.mockRestore();
      });

      it("returns list with default network when environmentConfig is not available", () => {
        const context = useContext.default();
        expect(context.networks.value).toEqual([DEFAULT_NETWORK]);
      });
    });

    describe("identifyNetwork:", () => {
      it("sets default network", () => {
        const context = useContext.default();
        context.identifyNetwork();
        expect(context.currentNetwork.value).toEqual(DEFAULT_NETWORK);
      });
      it("sets network by query param", () => {
        location.search = "?network=" + TESTNET_BETA_NETWORK.name;

        const mockEnvironmentConfig = vi.spyOn(useEnvironmentConfig, "default").mockReturnValue({
          networks: computed(() => [TESTNET_NETWORK, TESTNET_BETA_NETWORK]),
          baseTokenAddress: computed(() => "0x000000000000000000000000000000000000800A"),
        });
        const context = useContext.default();
        context.identifyNetwork();
        expect(context.currentNetwork.value).toEqual(TESTNET_BETA_NETWORK);
        mockEnvironmentConfig.mockRestore();
      });
      it("sets network by hostname", () => {
        location.origin = TESTNET_BETA_NETWORK.hostnames[0];

        const mockEnvironmentConfig = vi.spyOn(useEnvironmentConfig, "default").mockReturnValue({
          networks: computed(() => [TESTNET_NETWORK, TESTNET_BETA_NETWORK]),
          baseTokenAddress: computed(() => "0x000000000000000000000000000000000000800A"),
        });
        const context = useContext.default();
        context.identifyNetwork();
        expect(context.currentNetwork.value).toEqual(TESTNET_BETA_NETWORK);
        mockEnvironmentConfig.mockRestore();
      });
      it("sets network by sessionStorage", () => {
        const mockStorage = vi.spyOn(Storage.prototype, "getItem");
        Storage.prototype.getItem = vi.fn(() => TESTNET_BETA_NETWORK.name);

        const mockEnvironmentConfig = vi.spyOn(useEnvironmentConfig, "default").mockReturnValue({
          networks: computed(() => [TESTNET_NETWORK, TESTNET_BETA_NETWORK]),
          baseTokenAddress: computed(() => "0x000000000000000000000000000000000000800A"),
        });
        const context = useContext.default();
        context.identifyNetwork();
        expect(context.currentNetwork.value).toEqual(TESTNET_BETA_NETWORK);
        mockStorage.mockRestore();
        mockEnvironmentConfig.mockRestore();
      });
    });
  });

  describe("getL2Provider:", () => {
    const PUBLIC_NETWORK = { ...TESTNET_NETWORK, name: "public", rpcUrl: "https://rpc.example.com" };
    const PRIVIDIUM_NETWORK = {
      ...TESTNET_NETWORK,
      name: "prividium",
      prividium: true,
      apiUrl: "https://api.example.com",
      rpcUrl: "https://rpc.example.com",
    };

    const buildContext = (network: typeof TESTNET_NETWORK) => {
      const mockStorage = vi.spyOn(Storage.prototype, "getItem").mockReturnValue(network.name);
      const mockEnvironmentConfig = vi.spyOn(useEnvironmentConfig, "default").mockReturnValue({
        networks: computed(() => [network]),
        baseTokenAddress: computed(() => "0x000000000000000000000000000000000000800A"),
      });
      const context = useContext.default();
      context.identifyNetwork();
      return { context, restore: () => [mockStorage, mockEnvironmentConfig].forEach((m) => m.mockRestore()) };
    };

    it("connects straight to the RPC on a public network", () => {
      const { context, restore } = buildContext(PUBLIC_NETWORK);

      expect(context.getL2Provider()._getConnection().url).toBe("https://rpc.example.com");
      restore();
    });

    it("connects through the explorer API on a Prividium network", () => {
      const { context, restore } = buildContext(PRIVIDIUM_NETWORK);

      expect(context.getL2Provider()._getConnection().url).toBe("https://api.example.com/rpc");
      restore();
    });

    it("sends session credentials and an abort signal on a Prividium network", async () => {
      const { context, restore } = buildContext(PRIVIDIUM_NETWORK);
      const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      } as unknown as Response);

      const request = context.getL2Provider()._getConnection();
      await request.getUrlFunc(request);

      expect(fetchMock).toBeCalledWith(
        "https://api.example.com/rpc",
        expect.objectContaining({ credentials: "include", signal: expect.any(AbortSignal) })
      );
      fetchMock.mockRestore();
      restore();
    });

    it("aborts a Prividium request that exceeds the request timeout", async () => {
      const { context, restore } = buildContext(PRIVIDIUM_NETWORK);
      const fetchMock = vi.spyOn(global, "fetch").mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            (init as RequestInit).signal?.addEventListener("abort", () => reject(new Error("aborted")));
          })
      );

      const request = context.getL2Provider()._getConnection();
      request.timeout = 1;

      await expect(request.getUrlFunc(request)).rejects.toThrowError(/timeout/);
      fetchMock.mockRestore();
      restore();
    });
  });
});
