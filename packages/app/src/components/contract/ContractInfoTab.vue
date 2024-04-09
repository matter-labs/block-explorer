<template>
  <div class="contract-info-tabs-container">
    <Tabs v-if="tabs.length" class="contract-info-tabs" :tabs="tabs" :has-route="false">
      <template #tab-1-content>
        <ContractBytecode :contract="contract" />
      </template>
      <template #tab-2-content>
        <div class="functions-contract-container">
          <div v-if="!readFunctions.length">
            <Alert class="w-fit" type="notification">{{ missingReadFunctionsMessage }}</Alert>
          </div>
          <div v-else class="functions-dropdown-container">
            <div class="function-dropdown-spacer">
              <div class="metamask-button-container">
                <span class="function-type-title">{{ t("contract.abiInteraction.method.read.name") }}</span>
                <ConnectMetamaskButton />
              </div>
              <FunctionDropdown
                v-for="(item, index) in readFunctions"
                :key="item.name"
                type="read"
                :abi-fragment="item"
                :contract-address="contract.address"
              >
                {{ index + 1 }}. {{ item.name }}
              </FunctionDropdown>
            </div>
          </div>
        </div>
      </template>
      <template #tab-3-content>
        <div class="functions-contract-container">
          <div v-if="!writeFunctions?.length">
            <Alert class="w-fit" type="notification">{{ missingWriteFunctionsMessage }}</Alert>
          </div>
          <div v-else class="functions-dropdown-container">
            <div class="function-dropdown-spacer">
              <div class="metamask-button-container">
                <span class="function-type-title"> {{ t("contract.abiInteraction.method.write.name") }}</span>
                <ConnectMetamaskButton />
              </div>
              <FunctionDropdown
                v-for="(item, index) in writeFunctions"
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
      </template>
      <template #tab-4-content>
        <div class="functions-contract-container">
          <div class="proxy-implementation-link">
            <Alert v-if="contract.proxyInfo?.implementation.verificationInfo" class="w-fit" type="notification">
              <span>{{ t("contract.abiInteraction.contractImplementationFound") }}&nbsp;</span>
              <a :href="`/address/${contract.proxyInfo?.implementation.address}#contract`">
                <HashLabel :text="contract.proxyInfo?.implementation.address" /> </a
              >{{ "." }}
              <span>{{ t("contract.abiInteraction.proxyCautionMessage") }}</span>
            </Alert>
            <Alert v-else class="w-fit" type="warning">
              <span>{{ t("contract.abiInteraction.contractImplementationAt") }}&nbsp;</span>
              <a :href="`/address/${contract.proxyInfo?.implementation.address}#contract`">
                <HashLabel :text="contract.proxyInfo?.implementation.address" />
              </a>
              <span class="to-lowercase">&nbsp;{{ t("contract.abiInteraction.contractNotVerified") }}.</span>
              <br />
              <span>{{ t("contract.abiInteraction.verifyImplementationMessage") }}</span>
            </Alert>
          </div>
          <div v-if="contract.proxyInfo?.implementation.verificationInfo">
            <div v-if="!readProxyFunctions.length">
              <Alert class="w-fit" type="notification">{{ missingReadProxyFunctionsMessage }}</Alert>
            </div>
            <div v-else class="functions-dropdown-container">
              <div class="function-dropdown-spacer">
                <span class="function-type-title">{{ t("contract.abiInteraction.method.readAsProxy.name") }}</span>
                <FunctionDropdown
                  v-for="(item, index) in readProxyFunctions"
                  :key="item.name"
                  type="read"
                  :abi-fragment="item"
                  :contract-address="contract.address"
                >
                  {{ index + 1 }}. {{ item.name }}
                </FunctionDropdown>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #tab-5-content>
        <div class="functions-contract-container">
          <div class="proxy-implementation-link">
            <Alert v-if="contract.proxyInfo?.implementation.verificationInfo" class="w-fit" type="notification">
              <span>{{ t("contract.abiInteraction.contractImplementationFound") }}&nbsp;</span>
              <a :href="`/address/${contract.proxyInfo?.implementation.address}#contract`">
                <HashLabel :text="contract.proxyInfo?.implementation.address" /> </a
              >{{ "." }}
              <span>{{ t("contract.abiInteraction.proxyCautionMessage") }}</span>
            </Alert>
            <Alert v-else class="w-fit" type="warning">
              <span>{{ t("contract.abiInteraction.contractImplementationAt") }}&nbsp;</span>
              <a :href="`/address/${contract.proxyInfo?.implementation.address}#contract`">
                <HashLabel :text="contract.proxyInfo?.implementation.address" />
              </a>
              <span class="to-lowercase">&nbsp;{{ t("contract.abiInteraction.contractNotVerified") }}.</span>
              <br />
              <span>{{ t("contract.abiInteraction.verifyImplementationMessage") }}</span>
            </Alert>
          </div>
          <div v-if="contract.proxyInfo?.implementation.verificationInfo">
            <div v-if="!writeProxyFunctions?.length">
              <Alert class="w-fit" type="notification">{{ missingWriteProxyFunctionsMessage }}</Alert>
            </div>
            <div v-else class="functions-dropdown-container">
              <div class="function-dropdown-spacer">
                <div class="metamask-button-container">
                  <span class="function-type-title"> {{ t("contract.abiInteraction.method.writeAsProxy.name") }}</span>
                  <ConnectMetamaskButton />
                </div>
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
      </template>
    </Tabs>
    <ContractBytecode v-else :contract="contract" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ConnectMetamaskButton from "@/components/ConnectMetamaskButton.vue";
import Alert from "@/components/common/Alert.vue";
import HashLabel from "@/components/common/HashLabel.vue";
import Tabs from "@/components/common/Tabs.vue";
import ContractBytecode from "@/components/contract/ContractBytecode.vue";
import FunctionDropdown from "@/components/contract/interaction/FunctionDropdown.vue";

import type { Contract } from "@/composables/useAddress";
import type { PropType } from "vue";

const props = defineProps({
  contract: {
    type: Object as PropType<Contract>,
    default: () => ({}),
    required: true,
  },
});

const { t } = useI18n();

const missingReadFunctionsMessage = computed(() => {
  if (!readFunctions.value?.length) {
    return t("contract.bytecode.readMissingMessage");
  } else {
    return null;
  }
});
const missingWriteFunctionsMessage = computed(() => {
  if (!writeFunctions.value?.length) {
    return t("contract.bytecode.writeMissingMessage");
  } else {
    return null;
  }
});

const missingReadProxyFunctionsMessage = computed(() => {
  if (props.contract?.proxyInfo?.implementation.verificationInfo && !readProxyFunctions.value?.length) {
    return t("contract.bytecode.readMissingMessage");
  } else {
    return null;
  }
});
const missingWriteProxyFunctionsMessage = computed(() => {
  if (!writeProxyFunctions.value?.length) {
    return t("contract.bytecode.writeMissingMessage");
  } else {
    return null;
  }
});

const writeFunctions = computed(() => {
  return (
    props.contract?.verificationInfo?.artifacts.abi.filter(
      (item) =>
        item.name &&
        item.type !== "constructor" &&
        (item.stateMutability === "nonpayable" || item.stateMutability === "payable")
    ) || []
  );
});

const readFunctions = computed(() => {
  return (
    props.contract?.verificationInfo?.artifacts.abi.filter(
      (item) => (item.type !== "constructor" && item.stateMutability === "view") || item.stateMutability === "pure"
    ) || []
  );
});

const writeProxyFunctions = computed(() => {
  return (
    props.contract?.proxyInfo?.implementation.verificationInfo?.artifacts.abi.filter(
      (item) =>
        item.name &&
        item.type !== "constructor" &&
        (item.stateMutability === "nonpayable" || item.stateMutability === "payable")
    ) || []
  );
});

const readProxyFunctions = computed(() => {
  return (
    props.contract?.proxyInfo?.implementation.verificationInfo?.artifacts.abi.filter(
      (item) => (item.type !== "constructor" && item.stateMutability === "view") || item.stateMutability === "pure"
    ) || []
  );
});

const tabs = computed(() => {
  const isVerified = !!props.contract?.verificationInfo;
  const isProxy = !!props.contract?.proxyInfo;
  if (isVerified || isProxy) {
    return [
      { title: t("contractInfoTabs.contract"), hash: "#contract-info" },
      { title: t("contractInfoTabs.read"), hash: isVerified ? "#read" : null },
      { title: t("contractInfoTabs.write"), hash: isVerified ? "#write" : null },
      { title: t("contractInfoTabs.readAsProxy"), hash: isProxy ? "#read-proxy" : null },
      { title: t("contractInfoTabs.writeAsProxy"), hash: isProxy ? "#write-proxy" : null },
    ];
  }
  return [];
});
</script>

<style lang="scss">
.contract-info-tabs-container {
  @apply m-4;
  .contract-info-tabs {
    .tab-head {
      @apply gap-x-4 border-none;
      .active {
        @apply border-neutral-200 bg-neutral-200;
      }
      .tab-btn {
        @apply rounded-md border p-3 font-normal text-neutral-700;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.functions-contract-container {
  @apply mt-4;
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
  .proxy-implementation-link {
    @apply mb-4;
  }
  .to-lowercase {
    @apply lowercase;
  }
}
</style>
