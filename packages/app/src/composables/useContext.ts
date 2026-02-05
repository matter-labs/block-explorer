import { computed, type ComputedRef, type Ref, ref, watch } from "vue";

import { useStorage } from "@vueuse/core";
import { JsonRpcProvider } from "ethers";

import useEnvironmentConfig from "./useEnvironmentConfig";
import { DEFAULT_NETWORK } from "./useRuntimeConfig";

import type { NetworkConfig } from "@/configs";

import { checksumAddress } from "@/utils/formatters";
import { getWindowLocation } from "@/utils/helpers";

export type UserContext = { address: string; wallets: string[]; roles: string[]; loggedIn: true } | { loggedIn: false };

const network = useStorage("selectedNetwork_v2", DEFAULT_NETWORK.name);
const isReady = ref(false);
const user = ref<UserContext>({ loggedIn: false });

export type Context = {
  isReady: Ref<boolean>;
  user: Ref<UserContext>;
  currentNetwork: ComputedRef<NetworkConfig>;
  networks: ComputedRef<NetworkConfig[]>;
  getL2Provider: () => JsonRpcProvider;
  identifyNetwork: () => void;
  getSettlementChainExplorerUrl: (chainId: number | null) => string | undefined;
  getSettlementChainName: (chainId: number | null, commitTxHash?: string | null) => string;
  isGatewaySettlementChain: (chainId: number | null) => boolean;
};

let l2Provider: JsonRpcProvider | null;
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
    } else if (
      // If the data from storage wasn't used or is the same
      network.value === defaultNetwork.name ||
      // If the network is not in the list of networks. May happen if the network was removed from the config or renamed.
      !networks.value.some((e) => e.name === network.value)
    ) {
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
      l2Provider = new JsonRpcProvider(currentNetwork.value.rpcUrl, currentNetwork.value.l2ChainId, {
        staticNetwork: true,
      });
    }
    return l2Provider;
  }

  function getSettlementChainName(chainId: number | null, commitTxHash?: string | null) {
    const defaultChainName = "Ethereum";
    // If commitTxHash is not present yet - so is chainId and it's not possible to determine the settlement chain yet.
    // In this case we take the last chain from the settlementChains instead of default, assuming the last one is the latest.
    if (!chainId && !commitTxHash && currentNetwork.value.settlementChains?.length) {
      return (
        currentNetwork.value.settlementChains[currentNetwork.value.settlementChains.length - 1].name || defaultChainName
      );
    }
    if (!chainId || !currentNetwork.value.settlementChains?.length) {
      return defaultChainName;
    }
    return currentNetwork.value.settlementChains.find((chain) => chain.chainId === chainId)?.name || defaultChainName;
  }

  function getSettlementChainExplorerUrl(chainId: number | null) {
    if (!chainId || !currentNetwork.value.settlementChains?.length) {
      return currentNetwork.value.l1ExplorerUrl;
    }
    return (
      currentNetwork.value.settlementChains.find((chain) => chain.chainId === chainId)?.explorerUrl ||
      currentNetwork.value.l1ExplorerUrl
    );
  }

  function isGatewaySettlementChain(chainId: number | null) {
    if (!chainId || !currentNetwork.value.settlementChains?.length) {
      return false;
    }
    return !!currentNetwork.value.settlementChains
      .find((chain) => chain.chainId === chainId)
      ?.name.toLocaleLowerCase()
      .includes("gateway");
  }

  return {
    isReady,
    user,
    currentNetwork,
    networks,
    identifyNetwork,
    getL2Provider,
    getSettlementChainExplorerUrl,
    getSettlementChainName,
    isGatewaySettlementChain,
  };
};
