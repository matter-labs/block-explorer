<template>
  <router-link to="/login" class="login-button" :class="{ disabled: buttonDisabled }">
    <img src="/images/metamask.svg" class="metamask-image" />
    <button v-if="!address || isLoginPending" :disabled="buttonDisabled" class="connect-button">
      {{ buttonText }}
    </button>
    <template v-else>
      <HashLabel class="address-text" placement="left" :text="address" />
    </template>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import HashLabel from "@/components/common/HashLabel.vue";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import { default as useWallet } from "@/composables/useWallet";
import { useRouter } from "vue-router";

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
const { isLoginPending } = useLogin({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});
const router = useRouter();

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
  @apply flex min-w-[180px] items-center rounded-md border border-neutral-300 bg-white p-2 font-sans text-base text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 lg:border-primary-800 lg:bg-primary-800 lg:text-white align-middle no-underline hover:text-white;
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
}
</style>
