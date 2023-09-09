import { computed } from "vue";

import { afterEach, describe, expect, it, vi } from "vitest";

let location = {
  origin: "https://zkscan2.io",
  search: "",
};

vi.mock("@/utils/helpers", () => ({
  getWindowLocation: () => location,
}));

import { GOERLI_BETA_NETWORK, GOERLI_NETWORK } from "../mocks";

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
          networks: computed(() => [GOERLI_NETWORK, GOERLI_BETA_NETWORK]),
        });
        const context = useContext.default();
        expect(context.networks.value).toEqual([GOERLI_NETWORK, GOERLI_BETA_NETWORK]);
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
        location.search = "?network=" + GOERLI_BETA_NETWORK.name;

        const mockEnvironmentConfig = vi.spyOn(useEnvironmentConfig, "default").mockReturnValue({
          networks: computed(() => [GOERLI_NETWORK, GOERLI_BETA_NETWORK]),
        });
        const context = useContext.default();
        context.identifyNetwork();
        expect(context.currentNetwork.value).toEqual(GOERLI_BETA_NETWORK);
        mockEnvironmentConfig.mockRestore();
      });
      it("sets network by hostname", () => {
        location.origin = GOERLI_BETA_NETWORK.hostnames[0];

        const mockEnvironmentConfig = vi.spyOn(useEnvironmentConfig, "default").mockReturnValue({
          networks: computed(() => [GOERLI_NETWORK, GOERLI_BETA_NETWORK]),
        });
        const context = useContext.default();
        context.identifyNetwork();
        expect(context.currentNetwork.value).toEqual(GOERLI_BETA_NETWORK);
        mockEnvironmentConfig.mockRestore();
      });
      it("sets network by sessionStorage", () => {
        const mockStorage = vi.spyOn(Storage.prototype, "getItem");
        Storage.prototype.getItem = vi.fn(() => GOERLI_BETA_NETWORK.name);

        const mockEnvironmentConfig = vi.spyOn(useEnvironmentConfig, "default").mockReturnValue({
          networks: computed(() => [GOERLI_NETWORK, GOERLI_BETA_NETWORK]),
        });
        const context = useContext.default();
        context.identifyNetwork();
        expect(context.currentNetwork.value).toEqual(GOERLI_BETA_NETWORK);
        mockStorage.mockRestore();
        mockEnvironmentConfig.mockRestore();
      });
    });
  });
});
