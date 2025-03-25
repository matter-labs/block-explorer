<template>
  <div v-if="hasDiamondVerificationInfo" class="flex flex-col gap-2 w-full">
    <p class="font-semibold">{{ t("contract.abiInteraction.diamondProxySubtitleWrite") }}</p>
    <div class="flex flex-col md:flex-row w-full border rounded-lg">
      <div class="flex flex-col items-start w-full md:hidden p-2">
        <button @click="toggleIsMobileDropdownOpen()" class="facet-menu-button">
          <MenuIcon class="h-4 w-4" aria-hidden="true" />
          <span>Facet Menu</span>
        </button>
        <ul
          class="flex-col items-start justify-start border-r p-2 w-full"
          :class="{ flex: isMobileDropdownOpen, hidden: !isMobileDropdownOpen }"
        >
          <li class="facet-tab" v-for="item in contract.diamondProxyInfo" :key="item.implementation.address">
            <button
              type="button"
              class="facet-address-button"
              @click="setTabMobile(item.implementation.address)"
              :class="{ active: currentTabHash === item.implementation.address }"
            >
              <span class="facet-address-primary">{{ `${item.implementation.address.substring(0, 21)}...` }}</span>
              <span class="facet-address-secondary">{{ shortValue(item.implementation.address, 21) }}</span>
            </button>
          </li>
        </ul>
      </div>
      <ul class="hidden md:flex flex-col items-start justify-start border-r p-2">
        <li class="facet-tab" v-for="item in contract.diamondProxyInfo" :key="item.implementation.address">
          <button
            type="button"
            class="facet-address-button"
            @click="setTab(item.implementation.address)"
            :class="{ active: currentTabHash === item.implementation.address }"
          >
            <span class="facet-address-primary">{{ `${item.implementation.address.substring(0, 21)}...` }}</span>
            <span class="facet-address-secondary">{{ shortValue(item.implementation.address, 21) }}</span>
          </button>
        </li>
      </ul>
      <div class="w-full p-2">
        <div v-if="!writeProxyFunctions?.length" class="flex flex-col w-full gap-2">
          <p class="font-bold">{{ currentTabHash }}</p>
          <Alert class="w-fit" type="notification">{{ t("contract.bytecode.writeMissingMessage") }}</Alert>
        </div>
        <div v-else class="functions-dropdown-container">
          <div class="function-dropdown-spacer">
            <div class="metamask-button-container">
              <span class="function-type-title"> {{ t("contract.abiInteraction.method.writeAsProxy.name") }}</span>
              <ConnectMetamaskButton />
            </div>
            <p class="font-bold">{{ currentTabHash }}</p>
            <FunctionDropdown
              v-for="(item, index) in writeProxyFunctions"
              :key="item.name"
              type="write"
              :abi-fragment="item"
              :contract-address="contract.address"
            >
              {{ index + 1 }}. {{ item.name }}
            </FunctionDropdown>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { MenuIcon } from "@heroicons/vue/outline";

import ConnectMetamaskButton from "../ConnectMetamaskButton.vue";
import Alert from "../common/Alert.vue";

import FunctionDropdown from "@/components/contract/interaction/FunctionDropdown.vue";

import type { Contract } from "@/composables/useAddress";
import type { PropType } from "vue";

import { shortValue } from "@/utils/formatters";

const props = defineProps({
  contract: {
    type: Object as PropType<Contract>,
    default: () => ({}),
    required: true,
  },
});

const { t } = useI18n();

const writeProxyFunctions = computed(() => {
  return (
    props.contract?.diamondProxyInfo
      ?.find((item) => item.implementation.address === currentTabHash.value)
      ?.implementation.verificationInfo?.artifacts.abi.filter(
        (item) =>
          item.name &&
          item.type !== "constructor" &&
          (item.stateMutability === "nonpayable" || item.stateMutability === "payable")
      ) || []
  );
});

const hasDiamondVerificationInfo = computed(() => {
  return !!props.contract.diamondProxyInfo?.find((info) => info.implementation.verificationInfo);
});

const currentTabHash = ref(
  props.contract.diamondProxyInfo ? props.contract.diamondProxyInfo[0].implementation.address : ""
);

const isMobileDropdownOpen = ref(false);

const setTab = (address: string) => {
  currentTabHash.value = address;
};

const setTabMobile = (address: string) => {
  currentTabHash.value = address;
  toggleIsMobileDropdownOpen();
};

const toggleIsMobileDropdownOpen = () => {
  isMobileDropdownOpen.value = !isMobileDropdownOpen.value;
};
</script>

<style lang="scss" scoped>
.functions-dropdown-container {
  @apply grid grid-cols-1 gap-4 md:mb-10;
  .function-dropdown-spacer {
    @apply space-y-4;
    .metamask-button-container {
      @apply flex flex-col justify-between sm:flex-row;
    }
    .function-type-title {
      @apply text-xl leading-8 text-neutral-700;
    }
  }
}
.facet-tab {
  @apply w-full self-stretch;
  .facet-address-button {
    @apply p-2 rounded-md text-sm bg-opacity-[15%] text-primary-800 transition-colors hover:bg-primary-600 hover:bg-opacity-10 flex flex-col items-start justify-center self-stretch w-full;
    .facet-address-primary {
      @apply font-semibold;
    }
    .facet-address-secondary {
      @apply font-light text-primary-800/70;
    }
  }
}
.active {
  @apply bg-primary-600 bg-opacity-10;
}
.facet-menu-button {
  @apply p-2 rounded-md text-sm border text-primary-800 transition-colors flex gap-2 items-center justify-start self-stretch w-full;
}
</style>
