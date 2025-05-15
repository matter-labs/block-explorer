<template>
  <div class="wallet-status-bar">
    <NetworkIndicator :currentNetwork="currentNetwork" :isWrongNetwork="isWrongNetwork" />
    <ConnectMetamaskButton />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import ConnectMetamaskButton from "@/components/ConnectMetamaskButton.vue";
import NetworkIndicator from "@/components/NetworkIndicator.vue";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import useWallet from "@/composables/useWallet";

const context = useContext();
const { logout } = useLogin(context);
const currentNetwork = computed(() => context.currentNetwork.value);

const { address, getEthereumProvider } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});

const currentChainId = ref<string | null>(null);

const updateChainId = async () => {
  const provider = await getEthereumProvider();
  if (provider && provider.chainId) {
    currentChainId.value = provider.chainId;
  } else {
    currentChainId.value = null;
  }
};

function handleAccountsChanged(accounts: string[]) {
  if (accounts.length === 0) {
    logout();
  }
}

interface EthereumEvents {
  on(event: "accountsChanged", listener: (accounts: string[]) => void | Promise<void>): void;
  removeListener(event: "accountsChanged", listener: (accounts: string[]) => void | Promise<void>): void;
}

interface WithEthereum {
  ethereum: EthereumEvents;
}

onMounted(() => {
  updateChainId();
  if (isWindowWithEthereum(window)) {
    window.ethereum.on("accountsChanged", handleAccountsChanged);
  }
});

onUnmounted(() => {
  if (isWindowWithEthereum(window)) {
    window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isWindowWithEthereum(win: any): win is WithEthereum {
  return (
    // eslint-disable-next-line no-prototype-builtins
    win.hasOwnProperty("ethereum") &&
    // eslint-disable-next-line no-prototype-builtins
    win.ethereum.hasOwnProperty("on") &&
    // eslint-disable-next-line no-prototype-builtins
    win.ethereum.hasOwnProperty("removeListener")
  );
}

watch(
  () => address.value,
  async () => {
    if (address.value) {
      await updateChainId();
    } else {
      currentChainId.value = null;
    }
  }
);

const isWrongNetwork = computed(() => {
  if (!currentChainId.value) return false;
  return currentChainId.value !== `0x${currentNetwork.value.l2ChainId.toString(16)}`;
});
</script>

<style scoped>
.wallet-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
