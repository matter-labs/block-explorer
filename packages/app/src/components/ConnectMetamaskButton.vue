<template>
  <div class="metamask-button" :class="{ disabled: buttonDisabled }">
    <img src="/images/metamask.svg" class="metamask-image" />
    <button v-if="!displayAddress" :disabled="buttonDisabled" class="login-button" @click="connect">
      {{ buttonText }}
    </button>
    <template v-else>
      <HashLabel class="address-text" placement="left" :text="displayAddress" />
      <div class="dropdown-container">
        <Listbox>
          <ListboxButton class="dropdown-button">
            <DotsVerticalIcon class="h-5 w-5" />
          </ListboxButton>
          <ListboxOptions class="dropdown-options">
            <ListboxOption>
              <button class="logout-button" type="button" @click="handleLogout">
                {{ t("connectMetamaskButton.logout") }}
              </button>
            </ListboxOption>
          </ListboxOptions>
        </Listbox>
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
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { DotsVerticalIcon } from "@heroicons/vue/outline";

import HashLabel from "@/components/common/HashLabel.vue";

import useAddress from "@/composables/useAddress";
import useContext from "@/composables/useContext";
import useEnvironmentConfig from "@/composables/useEnvironmentConfig";
import useLogin from "@/composables/useLogin";
import { isAuthenticated, default as useWallet } from "@/composables/useWallet";

const { t } = useI18n();
const router = useRouter();
const context = useContext();
const { networks } = useEnvironmentConfig();
const { logout } = useLogin(context);

const { address, isConnectPending, isReady, isMetamaskInstalled, connect, disconnect } = useWallet({
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
  if (context.user.value.loggedIn) {
    return context.user.value.address;
  }
  return address.value;
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
};

const closeModal = () => {
  isWalletInfoModalOpen.value = false;
};

const handleLogout = async () => {
  await logout();
  await disconnect();
  router.push("/login");
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
</script>

<style lang="scss">
.metamask-button {
  @apply relative flex w-max min-w-[200px] items-center rounded-md border border-primary-800 bg-primary-800 p-2 text-white;
  &:not(.disabled) {
    @apply hover:cursor-pointer;
  }
  &.disabled {
    @apply opacity-50;
  }
  .metamask-image {
    @apply mr-2 h-4 w-4;
  }
  .address-text {
    @apply flex flex-none font-sans text-base;
  }
  .dropdown-container {
    @apply absolute right-2 top-1/2 -translate-y-1/2;
    .dropdown-button {
      @apply flex h-6 w-6 items-center justify-center rounded-md hover:bg-primary-700;
    }
    .dropdown-options {
      @apply absolute right-0 top-[calc(100%+4px)] w-[120px] rounded-lg bg-white shadow-md;
      .logout-button {
        @apply w-full rounded-lg px-2 py-1 text-left text-neutral-700 hover:bg-neutral-100;
      }
    }
  }
  .login-button {
    @apply font-sans text-base text-white;
    &:disabled {
      @apply cursor-not-allowed;
    }
  }
}
</style>
