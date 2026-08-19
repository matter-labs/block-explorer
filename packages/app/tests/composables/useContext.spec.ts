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
    const PRIVIDIUM_NETWORK = { ...TESTNET_NETWORK, name: "prividium", rpcUrl: "https://api.example.com/rpc" };
    const PUBLIC_NETWORK = { ...TESTNET_NETWORK, name: "public", rpcUrl: "https://rpc.example.com" };

    const buildContext = (network: typeof TESTNET_NETWORK, token: string | null) => {
      const mockStorage = vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => {
        return key === "prividium_jwt" ? token : network.name;
      });
      const mockEnvironmentConfig = vi.spyOn(useEnvironmentConfig, "default").mockReturnValue({
        networks: computed(() => [network]),
        baseTokenAddress: computed(() => "0x000000000000000000000000000000000000800A"),
      });
      const context = useContext.default();
      context.identifyNetwork();
      return { context, restore: () => [mockStorage, mockEnvironmentConfig].forEach((m) => m.mockRestore()) };
    };

    it("does not authorize requests on a public network", () => {
      const { context, restore } = buildContext(PUBLIC_NETWORK, null);

      expect(context.getL2Provider()._getConnection().getHeader("authorization")).toBeFalsy();
      restore();
    });

    it("sends the session token on a Prividium network", () => {
      const { context, restore } = buildContext({ ...PRIVIDIUM_NETWORK, prividium: true }, "jwt-token");

      expect(context.getL2Provider()._getConnection().getHeader("authorization")).toBe("Bearer jwt-token");
      restore();
    });
  });
});
