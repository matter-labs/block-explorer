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

        <div class="info-row">
          <div class="balance-info">
            <slot name="balance"></slot>
          </div>
          <div class="separator"></div>
          <div class="network-info">
            <span>{{ networkName }}</span>
          </div>
        </div>

        <button type="button" class="disconnect-button" @click="$emit('disconnect')">
          {{ t("walletInfoModal.disconnectButton") }}
        </button>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { XIcon } from "@heroicons/vue/outline";

import CopyButton from "@/components/common/CopyButton.vue";
import HashLabel from "@/components/common/HashLabel.vue";
import Popup from "@/components/common/Popup.vue";

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
});

defineEmits<{
  (eventName: "close"): void;
  (eventName: "disconnect"): void;
}>();

const { t } = useI18n();

const formattedAddress = computed(() => {
  if (props.address && props.address.length > 10) {
    return `${props.address.substring(0, 5)}...${props.address.substring(props.address.length - 3)}`;
  }
  return props.address;
});
</script>

<style lang="scss" scoped>
.wallet-info-modal-container {
  // This outer container helps with the fixed positioning of the popup content if needed
  // Popup.vue already handles centering, so we mainly focus on inner styling.
}

.wallet-info-modal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 32px 24px 24px;
  gap: 30px;
  isolation: isolate;
  width: 400px;
  min-height: 252px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.1);
  position: relative;

  .close-button-icon {
    @apply absolute top-6 right-6 text-neutral-700 hover:text-neutral-900;
  }

  .your-wallet-title {
    @apply font-sans font-medium text-sm leading-5 tracking-tight text-neutral-500;
  }

  .address-container {
    @apply w-full text-center -mt-6;

    .address-group {
      @apply inline-flex items-baseline gap-x-1.5; // Changed items-center to items-baseline

      .address-display {
        // No longer needs inline-block, styles target inner text
        :deep(span.displayed-string) {
          @apply font-sans font-medium text-xl leading-8 tracking-tight text-black;
        }
        :deep(span.actual-string) {
          @apply hidden;
        }
      }
      .address-copy-button {
        @apply w-5 h-5 text-neutral-500 hover:text-neutral-700; // Removed relative -top-px
      }
    }
  }

  .info-row {
    @apply flex w-full items-center;

    .balance-info,
    .network-info {
      @apply flex-1 font-sans font-medium text-sm leading-5 tracking-tight text-neutral-700 text-center;
    }

    .balance-info {
    }

    .network-info {
      span {
        @apply text-neutral-600;
      }
    }
    .separator {
      @apply h-5 w-px bg-black/[.10] mx-3;
    }
  }

  .disconnect-button {
    @apply w-full bg-black/[.10] hover:bg-black/[.15] text-black font-medium text-[14px] py-3 px-4 rounded-[8px];
    border: none;
    cursor: pointer;
    outline: none;
  }
}
</style>
