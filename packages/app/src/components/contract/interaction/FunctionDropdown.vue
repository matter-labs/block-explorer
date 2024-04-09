<template>
  <div>
    <button type="button" @click="opened = !opened" class="function-disclosure-btn" :class="{ opened: opened }">
      <span>
        <slot />
      </span>
      <ChevronDownIcon class="function-arrow-icon" />
    </button>
    <div class="function-disclosure-panel" :class="{ opened: opened }">
      <template v-if="abiFragment.outputs.length">
        <div v-for="(output, index) in abiFragment.outputs" :key="output.name + index">
          {{ output.name }} <span class="disclosure-panel-type-text">({{ output.type }})</span>
        </div>
      </template>
      <FunctionForm :type="type" :abi-fragment="abiFragment" :disabled="isRequestPending" @submit="submit">
        <Alert v-if="type === 'write' && !isMetamaskInstalled" type="error" class="wallet-not-found-error">
          {{ t("contract.abiInteraction.metaMaskNotFound") }}
        </Alert>
        <Button
          v-if="type === 'write' && !isWalletConnected"
          class="connect-wallet-button"
          :disabled="!isMetamaskInstalled"
          type="button"
          size="sm"
          @click="connectWallet"
        >
          {{ t("contract.abiInteraction.connectWalletToInteract") }}
        </Button>
        <Button v-else :loading="isRequestPending" :disabled="isRequestPending" type="submit" size="sm">
          {{ t(`contract.abiInteraction.method.${type}.action`) }}
        </Button>
      </FunctionForm>
      <div v-if="response?.message !== undefined" class="response-message">
        {{ response.message }}
      </div>
      <div v-else-if="response?.transactionHash" class="response-message">
        <i18n-t scope="global" keypath="contract.abiInteraction.transactionHash">
          <template #transactionHash>
            <router-link :to="{ name: 'transaction', params: { hash: response.transactionHash } }">
              {{ response.transactionHash }}
            </router-link>
          </template>
        </i18n-t>
      </div>
      <Alert v-if="errorMessage" type="error" class="error-message">
        {{ errorMessage }}
      </Alert>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { ChevronDownIcon } from "@heroicons/vue/outline";

import Alert from "@/components/common/Alert.vue";
import Button from "@/components/common/Button.vue";
import FunctionForm from "@/components/contract/interaction/FunctionForm.vue";

import useContractInteraction from "@/composables/useContractInteraction";

import type { AbiFragment } from "@/composables/useAddress";
import type { PropType } from "vue";

const props = defineProps({
  type: {
    type: String as PropType<"read" | "write">,
    default: "read",
  },
  abiFragment: {
    type: Object as PropType<AbiFragment>,
    default: () => ({}),
  },
  contractAddress: {
    type: String,
    default: "",
  },
});

const {
  response,
  isRequestPending,
  errorMessage,
  isWalletConnected,
  isMetamaskInstalled,
  connectWallet,
  writeFunction,
  readFunction,
} = useContractInteraction();

const opened = ref(false);

const { t } = useI18n();

const submit = async (form: Record<string, string | string[] | boolean | boolean[]>) => {
  const callFunction = props.type === "write" ? writeFunction : readFunction;
  await callFunction(props.contractAddress, props.abiFragment, form);
};
</script>

<style scoped lang="scss">
.function-disclosure-btn {
  @apply sticky top-0 z-[1] flex w-full items-center justify-between rounded-lg border bg-neutral-100 p-3 text-left text-base font-medium text-neutral-600;
  &.opened {
    @apply rounded-bl-none rounded-br-none;

    .function-arrow-icon {
      @apply rotate-180 transform;
    }
  }
  .function-arrow-icon {
    @apply h-5 w-5 text-neutral-500;
  }
}

.error-message {
  @apply break-all;
}

.response-message {
  @apply mt-2 break-words rounded-md bg-neutral-200 px-4 py-2 font-mono text-neutral-900;
}
.function-disclosure-panel {
  @apply hidden space-y-3 rounded-bl-lg rounded-br-lg border border-t-0 px-4 py-3 text-sm text-gray-500;
  &.opened {
    @apply block;
  }
  .disclosure-panel-type-text {
    @apply italic text-neutral-400;
  }
}
</style>
