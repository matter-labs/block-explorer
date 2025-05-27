<template>
  <Popup :opened="opened" @close="$emit('close')">
    <div class="wallet-info-modal-container">
      <div class="wallet-info-modal">
        <button @click="$emit('close')" class="close-button-icon">
          <XIcon class="h-6 w-6" />
        </button>
        <span class="your-wallet-title">{{ t("walletInfoModal.yourWalletTitle") }}</span>
        <div class="address-container">
          <span class="address-group">
            <HashLabel :text="formattedAddress" class="address-display" />
            <CopyButton :value="address" class="address-copy-button" />
          </span>
        </div>

        <div v-if="props.isWrongNetwork" class="network-mismatch-banner-ui">
          <div class="flex items-center w-full">
            <ExclamationCircleIcon class="h-6 w-6 mr-2 text-black" />
            <span class="text-lg text-black flex-1"> Your wallet activated an incorrect network </span>
          </div>
          <button class="switch-network-ui-btn" @click="switchNetwork">Switch to Prividium</button>
        </div>

        <div class="info-row">
          <div class="balance-info">
            <slot name="balance"></slot>
          </div>
          <div class="separator"></div>
          <div class="network-info">
            <span>{{ networkName }}</span>
          </div>
        </div>

        <button type="button" class="disconnect-ui-btn" @click="$emit('disconnect')">
          {{ t("walletInfoModal.disconnectButton") }}
        </button>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { ExclamationCircleIcon, XIcon } from "@heroicons/vue/outline";

import CopyButton from "@/components/common/CopyButton.vue";
import HashLabel from "@/components/common/HashLabel.vue";
import Popup from "@/components/common/Popup.vue";

import useContext from "@/composables/useContext";
import usePrividiumRpc from "@/composables/usePrividiumRpc";
import useWallet from "@/composables/useWallet";

const props = defineProps({
  opened: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    required: true,
  },
  networkName: {
    type: String,
    required: true,
  },
  networkChainId: {
    type: Number,
    required: true,
  },
  isWrongNetwork: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (eventName: "close"): void;
  (eventName: "disconnect"): void;
}>();

const { t } = useI18n();
const { updatePrividiumRpcUrl, prividiumRpcUrl } = usePrividiumRpc();
const context = useContext();
const { addNetwork } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: 0,
    ...context.currentNetwork.value,
  })),
});

const switchNetwork = async () => {
  await updatePrividiumRpcUrl();
  if (prividiumRpcUrl.value) {
    await addNetwork(prividiumRpcUrl.value);
    emit("close");
  }
};

const formattedAddress = computed(() => {
  if (props.address && props.address.length > 10) {
    return `${props.address.substring(0, 5)}...${props.address.substring(props.address.length - 3)}`;
  }
  return props.address;
});
</script>

<style lang="scss" scoped>
.wallet-info-modal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 32px 24px 24px;
  gap: 10px;
  isolation: isolate;
  width: 600px;
  min-height: 252px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.1);
  position: relative;
  text-align: center;

  .close-button-icon {
    @apply absolute top-6 right-6 text-neutral-700 hover:text-neutral-900;
  }

  .your-wallet-title {
    @apply font-sans font-medium text-lg leading-6 tracking-tight text-neutral-500 text-center;
    margin-bottom: 0.5rem;
  }

  .address-container {
    @apply w-full text-center;
    margin-top: 0;
    .address-group {
      @apply inline-flex items-baseline gap-x-1.5;
      .address-display {
        :deep(span.displayed-string) {
          @apply font-sans text-3xl leading-8 tracking-tight text-black;
        }
        :deep(span.actual-string) {
          @apply hidden;
        }
      }
      .address-copy-button {
        @apply w-6 h-6 text-neutral-500 hover:text-neutral-700;
      }
    }
  }

  .info-row {
    display: none;
  }
}

.network-mismatch-banner-ui {
  @apply w-full flex flex-col items-center justify-center text-center rounded-2xl px-6 py-5 mb-0 mt-10;
  background: #ffc81a;
}
.switch-network-ui-btn,
.disconnect-ui-btn {
  display: flex;
  justify-content: center;
  align-items: center;
}
.switch-network-ui-btn {
  @apply w-full mt-4 bg-[#23234C] text-white text-lg rounded-xl py-3 transition hover:bg-[#1a1a3a];
}
.disconnect-ui-btn {
  @apply w-full mt-4 bg-neutral-200 text-black text-lg rounded-xl py-3;
}
</style>
