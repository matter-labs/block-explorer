<template>
  <div class="account-error" v-if="failed && !pending">
    <PageError />
  </div>
  <template v-else-if="props.address && isAddress(props.address)">
    <AccountView v-if="!showTokenComponent" :account="(item as Account)" :pending="pending" :failed="failed" />
    <TokenView
      v-else
      :contract="tokenContract"
      :pending="pending"
      :failed="failed"
      :is-base-token="isPrividiumBaseTokenAddress"
    />
  </template>
</template>

<script lang="ts" setup>
import { computed, watchEffect } from "vue";

import AccountView from "@/components/Account.vue";
import PageError from "@/components/PageError.vue";
import TokenView from "@/components/Token.vue";

import useAddress, { type Account, type Contract } from "@/composables/useAddress";
import useContext from "@/composables/useContext";
import useNotFound from "@/composables/useNotFound";

import { isAddress, isAddressEqual } from "@/utils/validators";

const { useNotFoundView, setNotFoundView } = useNotFound();
const { currentNetwork } = useContext();

const { item, isRequestPending: pending, isRequestFailed: failed, getByAddress } = useAddress();

const props = defineProps({
  address: {
    type: String,
    required: true,
  },
});

const pageType = computed(() => {
  return item.value?.type ? item.value?.type : "account";
});

const isPrividiumBaseTokenAddress = computed(() => {
  const baseTokenAddress = currentNetwork.value.baseTokenAddress;
  return currentNetwork.value.prividium && isAddressEqual(props.address, baseTokenAddress);
});

const showTokenComponent = computed(() => pageType.value !== "account" || isPrividiumBaseTokenAddress.value);

const tokenContract = computed<Contract | null>(() => {
  if (!item.value) {
    return null;
  }

  if (item.value.type === "contract") {
    return item.value as Contract;
  }

  if (isPrividiumBaseTokenAddress.value) {
    return {
      type: "contract",
      address: item.value.address,
      blockNumber: item.value.blockNumber,
      balances: item.value.balances,
      bytecode: "",
      creatorAddress: "",
      creatorTxHash: "",
      createdInBlockNumber: 0,
      totalTransactions: 0,
      isEvmLike: true,
      verificationInfo: null,
      proxyInfo: null,
    };
  }

  return null;
});

useNotFoundView(pending, failed, item);

watchEffect(() => {
  if (!props.address || !isAddress(props.address)) {
    return setNotFoundView();
  }
  getByAddress(props.address);
});
</script>

<style lang="scss" scoped>
.account-error {
  @apply mt-24 flex justify-center;
}
</style>
