<template>
  <div class="metamask-button" :class="{ disabled: buttonDisabled }">
    <img src="/images/wallet_icon.svg" class="metamask-image" @click="openModalConditionally" />
    <button v-if="!displayAddress" :disabled="buttonDisabled" class="login-button" @click="connect">
      {{ buttonText }}
    </button>
    <template v-else>
      <HashLabel class="address-text" placement="left" :text="displayAddress" @click="openModal" />
      <div class="clickable-icon-area" @click="openModal">
        <DotsVerticalIcon class="h-5 w-5" />
      </div>
    </template>
  </div>
  <WalletInfoModal
    v-if="displayAddress"
    :opened="isWalletInfoModalOpen"
    :address="displayAddress"
    :networkName="context.currentNetwork.value.l2NetworkName"
    @close="closeModal"
    @disconnect="handleLogoutAndCloseModal"
  >
    <template #balance>
      <div v-if="isAccountDataPendingLocally" class="balance-loading">
        {{ t("walletInfoModal.loadingBalance") }}
      </div>
      <div v-else-if="accountEthBalance && ethTokenForDisplay">
        <TokenAmountPrice :token="ethTokenForDisplay" :amount="accountEthBalance" />
      </div>
      <div v-else>
        {{ t("walletInfoModal.noEthBalance") }}
      </div>
      <!-- We can iterate through accountData?.balances for other tokens here if needed -->
    </template>
  </WalletInfoModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { DotsVerticalIcon } from "@heroicons/vue/outline";

import TokenAmountPrice from "@/components/TokenAmountPrice.vue";
import HashLabel from "@/components/common/HashLabel.vue";
import WalletInfoModal from "@/components/modals/WalletInfoModal.vue";

import useAddress, { type Account } from "@/composables/useAddress";
import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import { isAuthenticated, default as useWallet } from "@/composables/useWallet";

import type { Token } from "@/composables/useToken";

import { BASE_TOKEN_L2_ADDRESS } from "@/utils/constants";

const { t } = useI18n();
const router = useRouter();
const context = useContext();
const { logout } = useLogin(context);

const {
  address,
  isConnectPending,
  isReady,
  isMetamaskInstalled,
  connect,
  disconnect: walletDisconnect,
} = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});

const { item: accountData, isRequestPending: accDataPending, getByAddress } = useAddress();

const isWalletInfoModalOpen = ref(false);
// To avoid showing stale data briefly if modal is closed and reopened quickly
const isAccountDataPendingLocally = ref(false);

const displayAddress = computed(() => {
  if (context.user.value.loggedIn && context.user.value.address) {
    return context.user.value.address;
  }
  if (isAuthenticated.value && address.value) {
    return address.value;
  }
  return null;
});

const openModal = () => {
  if (displayAddress.value) {
    isWalletInfoModalOpen.value = true;
  }
};

// Wrapper for icon click, so it only opens modal if an address is already displayed
const openModalConditionally = () => {
  if (displayAddress.value) {
    openModal();
  }
  // If no address, clicking the icon does nothing, like the main button area
};

const closeModal = () => {
  isWalletInfoModalOpen.value = false;
};

const handleLogout = async () => {
  await logout();
  await walletDisconnect();
  router.push("/login");
};

const handleLogoutAndCloseModal = async () => {
  await handleLogout();
  closeModal();
};

watch(isWalletInfoModalOpen, async (isOpen) => {
  if (isOpen && displayAddress.value) {
    isAccountDataPendingLocally.value = true;
    // Use accDataPending from useAddress to track loading state
    // and ensure accountData is properly typed before accessing it.
    try {
      await getByAddress(displayAddress.value);
    } finally {
      isAccountDataPendingLocally.value = false;
    }
  } else if (!isOpen) {
    // Reset account data when modal is closed to ensure fresh data next time
    accountData.value = null;
  }
});

const accountEthBalance = computed(() => {
  const currentAccountData = accountData.value as Account | null; // Ensure type
  if (currentAccountData?.balances && currentAccountData.balances[BASE_TOKEN_L2_ADDRESS]) {
    return currentAccountData.balances[BASE_TOKEN_L2_ADDRESS].balance;
  }
  return null;
});

const ethTokenForDisplay = computed((): Token | undefined => {
  const currentAccountData = accountData.value as Account | null; // Ensure type
  const balances = currentAccountData?.balances;
  if (balances && balances[BASE_TOKEN_L2_ADDRESS]?.token) {
    return balances[BASE_TOKEN_L2_ADDRESS].token;
  }
  // TODO
  // Fallback to a generic ETH token structure if not in balances but is the base token
  if (context.currentNetwork.value.baseTokenAddress === BASE_TOKEN_L2_ADDRESS) {
    return {
      l1Address: "",
      l2Address: BASE_TOKEN_L2_ADDRESS,
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      usdPrice: null,
      liquidity: null,
      iconURL: "/images/eth.svg",
    } as Token;
  }
  return undefined;
});

const buttonDisabled = computed(() => !isMetamaskInstalled.value || isConnectPending.value || !isReady.value);
const buttonText = computed(() => {
  if (isConnectPending.value) {
    return t("connectMetamaskButton.connecting");
  }
  if (!isMetamaskInstalled.value) {
    return t("connectMetamaskButton.metaMaskNotFound");
  }
  return t("connectMetamaskButton.label");
});
</script>

<style lang="scss">
.metamask-button {
  @apply relative flex w-max min-w-[200px] items-center rounded-md border border-[#27274E] bg-[#27274E] p-2 text-white;
  &:not(.disabled) {
    @apply hover:cursor-pointer;
    &:hover {
      @apply bg-primary-700;
    }
  }
  &.disabled {
    @apply opacity-50;
  }
  .metamask-image {
    @apply mr-2 h-4 w-4;
    &.clickable {
      @apply cursor-pointer;
    }
  }
  .address-text {
    @apply flex flex-none font-sans font-medium text-sm leading-5 cursor-pointer;
  }
  .clickable-icon-area {
    @apply absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md hover:bg-primary-700 cursor-pointer;
  }
  .login-button {
    @apply font-sans font-medium text-sm leading-5 text-white;
    &:disabled {
      @apply cursor-not-allowed;
    }
  }
}
.balance-loading {
  @apply text-sm text-neutral-500;
}
</style>
