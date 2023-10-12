import { computed, ref } from "vue";

import type { EnvironmentConfig, NetworkConfig } from "@/configs";

const config = ref<EnvironmentConfig | null>(null);

const HYPERCHAIN_CONFIG_NAME = "hyperchain";
const DEVELOPMENT_CONFIG_NAME = "dev";

export async function loadEnvironmentConfig(appEnvironment: string): Promise<void> {
  let envConfig: EnvironmentConfig;
  if (appEnvironment === "default") {
    try {
      envConfig = (await import(`../configs/${HYPERCHAIN_CONFIG_NAME}.config.json`)).default;
    } catch {
      envConfig = (await import(`../configs/${DEVELOPMENT_CONFIG_NAME}.config.json`)).default;
    }
  } else {
    envConfig = (await import(`../configs/${appEnvironment}.config.json`)).default;
  }
  config.value = envConfig;
}

export default () => {
  return {
    networks: computed((): NetworkConfig[] =>
      config.value && Array.isArray(config.value.networks)
        ? config.value.networks.filter((e) => e.published === true)
        : []
    ),
  };
};
