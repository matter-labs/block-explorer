<template>
  <div class="wallet-button" :class="{ disabled: buttonDisabled }" @click="openModalConditionally">
    <img src="/images/metamask.svg" class="wallet-image" />
    <button v-if="!displayAddress" :disabled="buttonDisabled" class="login-button" @click="handleLogin">
      {{ buttonText }}
    </button>
    <HashLabel v-else class="address-text" placement="left" :text="shortenedAddress" />
  </div>
  <WalletInfoModal
    :opened="isWalletInfoModalOpen"
    :address="displayAddress ?? ''"
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
import { useRouter } from "vue-router";

import { FetchError } from "ohmyfetch";

import HashLabel from "@/components/common/HashLabel.vue";
import WalletInfoModal from "@/components/prividium/WalletInfoModal.vue";

import useAddress from "@/composables/useAddress";
import useContext from "@/composables/useContext";
import useEnvironmentConfig from "@/composables/useEnvironmentConfig";
import useLogin from "@/composables/useLogin";
import { isAuthenticated, default as useWallet } from "@/composables/useWallet";

import { formatShortAddress } from "@/utils/formatters";
import logger from "@/utils/logger";

const { t } = useI18n();
const context = useContext();
const { networks } = useEnvironmentConfig();
const { login, logout, isLoginPending } = useLogin(context);
const router = useRouter();

const { address, isConnectPending, isMetamaskInstalled } = useWallet({
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

const openModalConditionally = () => {
  if (displayAddress.value !== null) {
    isWalletInfoModalOpen.value = true;
  }
};

const closeModal = () => {
  isWalletInfoModalOpen.value = false;
};

const handleLogin = async () => {
  try {
    await login();
  } catch (err: unknown) {
    if (err instanceof FetchError && err.response?.status === 403) {
      router.push({ name: "not-authorized" });
    } else {
      logger.error(err);
    }
  }
};

const handleLogoutAndCloseModal = async () => {
  await logout();
  closeModal();
};

const buttonDisabled = computed(() => {
  return isLoginPending.value;
});

const buttonText = computed(() => {
  if (isLoginPending.value) {
    return t("connectMetamaskButton.redirecting");
  }
  if (isConnectPending.value) {
    return t("connectMetamaskButton.connecting");
  }
  if (!isMetamaskInstalled.value) {
    return t("connectMetamaskButton.metaMaskNotFound");
  }
  return t("connectMetamaskButton.label");
});

const shortenedAddress = computed(() => {
  if (displayAddress.value === null) {
    return "";
  }
  return formatShortAddress(displayAddress.value);
});
</script>

<style scoped lang="scss">
.wallet-button {
  @apply relative flex min-h-[42px] min-w-[150px] items-center justify-center rounded-md border border-[#27274E] bg-[#27274E] p-2 text-white;
  &:not(.disabled) {
    @apply hover:cursor-pointer;
    &:hover {
      @apply bg-primary-700;
    }
  }
  &.disabled {
    @apply opacity-50;
  }
  .wallet-image {
    @apply mr-2 h-5 w-5;
    &.clickable {
      @apply cursor-pointer;
    }
  }
  .address-text {
    @apply flex w-full cursor-pointer items-center justify-center font-sans text-sm font-medium leading-5;
  }
  .clickable-icon-area {
    @apply absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md hover:bg-primary-700;
  }
  .login-button {
    @apply font-sans text-sm font-medium leading-5 text-white;
    &:disabled {
      @apply cursor-not-allowed;
    }
  }
}
.balance-loading {
  @apply text-sm text-neutral-500;
}
</style>
