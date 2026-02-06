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

        <!-- Wallet switcher - only show when multiple wallets are available -->
        <div v-if="hasMultipleWallets" class="wallet-switcher">
          <div class="wallet-switcher-title">{{ t("walletInfoModal.switchWallet") }}</div>
          <div class="wallet-list">
            <button
              v-for="wallet in availableWallets"
              :key="wallet"
              @click="handleWalletSwitch(wallet)"
              :disabled="wallet === address || isSwitching"
              class="wallet-item"
              :class="{ 'wallet-item-active': wallet === address, 'wallet-item-disabled': isSwitching }"
            >
              <span class="wallet-address">
                {{ `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}` }}
              </span>
              <span v-if="wallet === address" class="active-badge">Active</span>
            </button>
          </div>
        </div>

        <button type="button" class="disconnect-ui-btn" @click="logout()">
          {{ t("walletInfoModal.logoutButton") }}
        </button>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { XIcon } from "@heroicons/vue/outline";

import CopyButton from "@/components/common/CopyButton.vue";
import HashLabel from "@/components/common/HashLabel.vue";
import Popup from "@/components/common/Popup.vue";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";

const props = defineProps({
  opened: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (eventName: "close"): void;
}>();

const { t } = useI18n();
const context = useContext();
const { logout, switchWallet } = useLogin(context);

const isSwitching = ref(false);

const availableWallets = computed(() => {
  if (context.user.value.loggedIn) {
    return context.user.value.wallets || [];
  }
  return [];
});

const hasMultipleWallets = computed(() => {
  return availableWallets.value.length > 1;
});

const handleWalletSwitch = async (newAddress: string) => {
  if (newAddress === props.address || isSwitching.value) return;

  try {
    isSwitching.value = true;
    await switchWallet(newAddress);
    window.location.href = "/"; // Triggers full reload of the page
    emit("close");
  } catch (error) {
    console.error("Failed to switch wallet:", error);
  } finally {
    isSwitching.value = false;
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
    @apply absolute right-6 top-6 text-neutral-700 hover:text-neutral-900;
  }

  .your-wallet-title {
    @apply text-center font-sans text-lg font-medium leading-6 tracking-tight text-neutral-500;
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
        @apply h-6 w-6 text-neutral-500 hover:text-neutral-700;
      }
    }
  }

  .info-row {
    display: none;
  }
}

.network-mismatch-banner-ui {
  @apply mb-0 mt-10 flex w-full flex-col items-center justify-center rounded-2xl px-6 py-5 text-center;
  background: #ffc81a;
}

.disconnect-ui-btn {
  @apply mt-4 flex w-full items-center justify-center rounded-xl bg-neutral-200 py-3 text-lg text-black;
}

.wallet-switcher {
  @apply mb-2 mt-6 w-full;

  .wallet-switcher-title {
    @apply mb-3 font-sans text-sm font-medium leading-5 text-neutral-500;
  }

  .wallet-list {
    @apply flex flex-col gap-2;

    .wallet-item {
      @apply flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 transition-colors hover:bg-neutral-100;

      &.wallet-item-active {
        @apply border-blue-300 bg-blue-50;
      }

      &.wallet-item-disabled {
        @apply cursor-not-allowed opacity-50;
      }

      &:disabled:not(.wallet-item-active) {
        @apply hover:bg-neutral-50;
      }

      .wallet-address {
        @apply font-mono text-sm text-neutral-700;
      }

      .active-badge {
        @apply rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600;
      }
    }
  }
}
</style>
