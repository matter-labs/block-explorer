<template>
  <div class="metamask-button" :class="{ disabled: buttonDisabled }">
    <img src="/images/wallet_icon.svg" class="metamask-image" @click="openModalConditionally" />
    <button v-if="!displayAddress" :disabled="buttonDisabled" class="login-button" @click="connect">
      {{ buttonText }}
    </button>
    <template v-else>
      <HashLabel class="address-text" placement="left" :text="shortenedAddress" @click="openModal" />
    </template>
  </div>
  <WalletInfoModal
    v-if="displayAddress"
    :opened="isWalletInfoModalOpen"
    :address="displayAddress"
    :networkName="context.currentNetwork.value.l2NetworkName"
    :networkChainId="context.currentNetwork.value.l2ChainId"
    :isWrongNetwork="isWrongNetwork"
    @close="closeModal"
    @disconnect="handleLogoutAndCloseModal"
  >
    <template #balance>
      <div v-if="isAccountDataPendingLocally">Loading...</div>
      <div v-else>
        <span
          >{{ accountBaseTokenInfo.accountBaseTokenBalance }} {{ accountBaseTokenInfo.accountBaseTokenSymbol }}</span
        >
      </div>
    </template>
  </WalletInfoModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import HashLabel from "@/components/common/HashLabel.vue";
import WalletInfoModal from "@/components/modals/WalletInfoModal.vue";

import useAddress from "@/composables/useAddress";
import useContext from "@/composables/useContext";
import useEnvironmentConfig from "@/composables/useEnvironmentConfig";
import useLogin from "@/composables/useLogin";
import { isAuthenticated, default as useWallet } from "@/composables/useWallet";

import { formatShortAddress } from "@/utils/formatters";

const { t } = useI18n();
const context = useContext();
const { networks } = useEnvironmentConfig();
const { logout } = useLogin(context);

const {
  address,
  isConnectPending,
  isReady,
  isMetamaskInstalled,
  connect,
  disconnect: walletDisconnect,
  currentChainId,
} = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});

const isWalletInfoModalOpen = ref(false);

const displayAddress = computed(() => {
  if (context.user.value.loggedIn && context.user.value.address !== null) {
    return context.user.value.address;
  }
  if (isAuthenticated.value && address.value !== null) {
    return address.value;
  }
  return null;
});

const { item: accountData, getByAddress } = useAddress();
const isAccountDataPendingLocally = ref(false);

const isWrongNetwork = computed(() => {
  if (currentChainId.value === null) return false;
  return currentChainId.value !== `0x${context.currentNetwork.value.l2ChainId.toString(16)}`;
});

watch(isWalletInfoModalOpen, async (isOpen) => {
  if (isOpen && displayAddress.value) {
    isAccountDataPendingLocally.value = true;
    try {
      await getByAddress(displayAddress.value);
    } finally {
      isAccountDataPendingLocally.value = false;
    }
  } else if (!isOpen) {
    accountData.value = null;
  }
});

const accountBaseTokenInfo = computed(() => {
  const balance = accountData.value?.balances?.[networks.value[0].baseTokenAddress]?.balance ?? 0;
  const symbol = accountData.value?.balances?.[networks.value[0].baseTokenAddress]?.token?.symbol ?? "ETH";
  return { accountBaseTokenBalance: balance, accountBaseTokenSymbol: symbol };
});

const openModal = () => {
  if (displayAddress.value !== null) {
    isWalletInfoModalOpen.value = true;
  }
};

const openModalConditionally = () => {
  if (displayAddress.value !== null) {
    openModal();
  }
};

const closeModal = () => {
  isWalletInfoModalOpen.value = false;
};

const handleLogout = async () => {
  await logout();
  walletDisconnect();
};

const handleLogoutAndCloseModal = async () => {
  await handleLogout();
  closeModal();
};

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

const shortenedAddress = computed(() => formatShortAddress(displayAddress.value));
</script>

<style lang="scss">
.metamask-button {
  @apply relative flex w-full min-w-[150px] min-h-[42px] items-center justify-center rounded-md border border-[#27274E] bg-[#27274E] p-2 text-white;
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
    @apply flex font-sans font-medium text-sm leading-5 cursor-pointer items-center justify-center w-full;
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
