import { describe, expect, it, vi } from "vitest";

import { GOERLI_BETA_NETWORK, GOERLI_NETWORK } from "../mocks";

import useEnvironmentConfig, { loadEnvironmentConfig } from "@/composables/useEnvironmentConfig";

import type { RuntimeConfig } from "@/configs";

vi.mock("../../src/configs/local.config", () => {
  return {
    default: {
      networks: [GOERLI_BETA_NETWORK, GOERLI_NETWORK],
    },
  };
});

vi.mock("../../src/configs/staging.config", () => {
  return {
    default: {
      networks: [GOERLI_BETA_NETWORK, { ...GOERLI_NETWORK, published: false }],
    },
  };
});

vi.mock("../../src/configs/production.config", () => {
  return {
    default: {
      networks: null,
    },
  };
});

describe("useEnvironmentConfig:", () => {
  it("creates environment config composable", () => {
    const { networks } = useEnvironmentConfig();

    expect(networks).toBeDefined();
    expect(loadEnvironmentConfig).toBeDefined();
  });

  describe("loadEnvironmentConfig", () => {
    it("sets networks data to config", async () => {
      const { networks } = useEnvironmentConfig();
      await loadEnvironmentConfig({ appEnvironment: "local" } as RuntimeConfig);
      expect(networks.value).toEqual([GOERLI_BETA_NETWORK, GOERLI_NETWORK]);
    });

    it("sets networks to values from runtime config if specified", async () => {
      const runtimeConfig = {
        environmentConfig: {
          networks: [
            {
              name: "runtime network",
              published: true,
            },
          ],
        },
        appEnvironment: "local",
      } as RuntimeConfig;
      const { networks } = useEnvironmentConfig();
      await loadEnvironmentConfig(runtimeConfig);
      expect(networks.value).toEqual([
        {
          name: "runtime network",
          published: true,
        },
      ]);
    });
  });

  describe("networks", () => {
    it("returns empty array when networks are not defined", async () => {
      const { networks } = useEnvironmentConfig();
      await loadEnvironmentConfig({ appEnvironment: "production" } as RuntimeConfig);
      expect(networks.value).toEqual([]);
    });
    it("returns only published network configs", async () => {
      const { networks } = useEnvironmentConfig();
      await loadEnvironmentConfig({ appEnvironment: "staging" } as RuntimeConfig);
      expect(networks.value).toEqual([GOERLI_BETA_NETWORK]);
    });
  });
});
