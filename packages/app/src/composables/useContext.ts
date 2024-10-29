import { computed, type ComputedRef, type Ref, ref, watch } from "vue";

import { useStorage } from "@vueuse/core";
import { Provider } from "zksync-ethers";

import useEnvironmentConfig from "./useEnvironmentConfig";
import { DEFAULT_NETWORK } from "./useRuntimeConfig";

import type { NetworkConfig } from "@/configs";

import { checksumAddress } from "@/utils/formatters";
import { getWindowLocation } from "@/utils/helpers";

const network = useStorage("selectedNetwork_v2", DEFAULT_NETWORK.name);
const isReady = ref(false);

export type Context = {
  isReady: Ref<boolean>;
  currentNetwork: ComputedRef<NetworkConfig>;
  networks: ComputedRef<NetworkConfig[]>;
  getL2Provider: () => Provider;
  identifyNetwork: () => void;
};

let l2Provider: Provider | null;
export default (): Context => {
  const environmentConfig = useEnvironmentConfig();

  const networks = computed<NetworkConfig[]>(() => {
    const configuredNetworks =
      Array.isArray(environmentConfig.networks.value) && environmentConfig.networks.value.length
        ? environmentConfig.networks.value
        : [DEFAULT_NETWORK];
    configuredNetworks.forEach((network) => (network.baseTokenAddress = checksumAddress(network.baseTokenAddress)));
    return configuredNetworks;
  });
  const currentNetwork = computed(() => {
    return (
      networks.value.find((networkEntry) => networkEntry.name === network.value) ?? networks.value[0] ?? DEFAULT_NETWORK
    );
  });

  function identifyNetwork() {
    const networkFromQueryParam = new URLSearchParams(getWindowLocation().search).get("network");
    const networkOnDomain = networks.value.find((e) => e.hostnames.includes(getWindowLocation().origin));
    const defaultNetwork = networks.value[0] ?? DEFAULT_NETWORK;
    if (networkFromQueryParam) {
      network.value = networkFromQueryParam;
      // If the data from storage wasn't used or is the same
    } else if (network.value === defaultNetwork.name) {
      if (networkOnDomain) {
        network.value = networkOnDomain.name;
      } else {
        network.value = defaultNetwork.name;
      }
    }

    isReady.value = true;
  }

  watch(currentNetwork, () => {
    // reset l2Provider on network change so it is recreated for the correct network in getL2Provider
    l2Provider = null;
  });

  function getL2Provider() {
    if (!l2Provider) {
      l2Provider = new Provider(currentNetwork.value.rpcUrl);
    }
    return l2Provider;
  }

  return {
    isReady,
    currentNetwork,
    networks,
    identifyNetwork,
    getL2Provider,
  };
};
