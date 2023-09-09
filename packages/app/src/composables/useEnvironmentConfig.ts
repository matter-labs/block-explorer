import { computed, ref } from "vue";

import type { EnvironmentConfig, NetworkConfig } from "@/configs";

const config = ref<EnvironmentConfig | null>(null);

export async function loadEnvironmentConfig(appEnvironment: string): Promise<void> {
  const { default: envConfig } = await import(`../configs/${appEnvironment}.config.ts`);
  config.value = envConfig as EnvironmentConfig;
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
