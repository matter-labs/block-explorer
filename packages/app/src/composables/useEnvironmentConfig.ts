import { computed, ref } from "vue";

import type { EnvironmentConfig, NetworkConfig, RuntimeConfig } from "@/configs";

const config = ref<EnvironmentConfig | null>(null);

const HYPERCHAIN_CONFIG_NAME = "hyperchain";
const DEVELOPMENT_CONFIG_NAME = "dev";

export async function loadEnvironmentConfig(runtimeConfig: RuntimeConfig): Promise<void> {
  // runtime environment config takes precedence over hard coded config
  if (runtimeConfig.environmentConfig) {
    config.value = runtimeConfig.environmentConfig;
    return;
  }

  let envConfig: EnvironmentConfig;
  if (runtimeConfig.appEnvironment === "default") {
    try {
      envConfig = (await import(`../configs/${HYPERCHAIN_CONFIG_NAME}.config.json`)).default;
    } catch {
      envConfig = (await import(`../configs/${DEVELOPMENT_CONFIG_NAME}.config.json`)).default;
    }
  } else {
    envConfig = (await import(`../configs/${runtimeConfig.appEnvironment}.config.json`)).default;
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
