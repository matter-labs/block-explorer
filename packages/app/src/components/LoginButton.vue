<template>
  <div class="login-button" :class="{ disabled: buttonDisabled }">
    <img src="/images/metamask.svg" class="metamask-image" />
    <button v-if="!address || isLoginPending" :disabled="buttonDisabled" class="connect-button" @click="handleLogin">
      {{ buttonText }}
    </button>
    <template v-else>
      <HashLabel class="address-text" placement="left" :text="address" />
      <div class="dropdown-container">
        <Listbox>
          <ListboxButton class="dropdown-button">
            <DotsVerticalIcon />
          </ListboxButton>
          <ListboxOptions class="dropdown-options">
            <ListboxOption>
              <button class="logout-button" type="button" @click="handleLogout">
                {{ t("loginButton.logout") }}
              </button>
            </ListboxOption>
          </ListboxOptions>
        </Listbox>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";


import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { DotsVerticalIcon } from "@heroicons/vue/outline";

import HashLabel from "@/components/common/HashLabel.vue";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import { default as useWallet } from "@/composables/useWallet";

const { t } = useI18n();

const context = useContext();

const { address, isConnectPending, isReady, isMetamaskInstalled, connect, disconnect } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});
const { login, logout, isLoginPending } = useLogin({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});

async function handleLogin() {
  await connect();
  try {
    await login();
  } catch (error) {
    console.error(error);
    disconnect();
  }
}

async function handleLogout() {
  await logout();
  disconnect();
}

const buttonDisabled = computed(() => !isMetamaskInstalled.value || isConnectPending.value || !isReady.value);
const buttonText = computed(() => {
  if (isConnectPending.value || isLoginPending.value) {
    return t("loginButton.connecting");
  }
  if (!isMetamaskInstalled.value) {
    return t("loginButton.metaMaskNotFound");
  }
  return t("loginButton.label");
});
</script>

<style lang="scss">
.login-button {
  @apply flex min-w-[180px] items-center rounded-md border border-neutral-300 bg-white p-2 font-sans text-base text-neutral-700 hover:cursor-pointer focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 lg:border-primary-800 lg:bg-primary-800 lg:text-white align-middle;
  &.disabled {
    @apply opacity-50;
  }
  .metamask-image {
    @apply mr-2 h-[24px] w-[24px];
  }
  .connect-button {
    @apply w-full text-left;
  }
  .address-text {
    @apply flex flex-none;
  }
  .dropdown-container {
    @apply absolute left-0 right-0 top-2 z-10 flex flex-col items-end;
    .dropdown-button {
      @apply mr-1 h-6 w-6 rounded-md;
    }
    .dropdown-options {
      @apply top-[10px] w-full self-start rounded-lg bg-white shadow-md;
      .logout-button {
        @apply w-full rounded-lg px-2 py-2 text-left text-neutral-700 hover:bg-neutral-200;
      }
    }
  }
}
</style>
