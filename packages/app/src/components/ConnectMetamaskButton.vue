<template>
  <div class="metamask-button" :class="{ disabled: buttonDisabled }">
    <img src="/images/metamask.svg" class="metamask-image" />
    <button v-if="!address" :disabled="buttonDisabled" class="login-button" @click="connect">
      {{ buttonText }}
    </button>
    <template v-else>
      <HashLabel class="address-text" placement="left" :text="address" />
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
  @apply relative flex w-max min-w-[200px] rounded-lg bg-neutral-200 p-1 pl-2 pr-5 text-neutral-900;
  &.disabled {
    @apply opacity-50;
  }
  .metamask-image {
    @apply mr-2 h-[24px] w-[24px];
  }
  .address-text {
    @apply flex flex-none;
  }
}
</style>
