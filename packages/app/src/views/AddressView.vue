<template>
  <div class="account-error" v-if="failed && !pending">
    <PageError />
  </div>
  <template v-else-if="props.address && isAddress(props.address)">
    <AccountView
      v-if="pageType === 'account'"
      :account="item as Account"
      :pending="pending"
      :failed="failed"
      :authorized="authorized"
    />
    <ContractView v-else :contract="item as Contract" :pending="pending" :failed="failed" :unauthorized="true" />
  </template>
</template>

<script lang="ts" setup>
import { computed, watchEffect } from "vue";

import AccountView from "@/components/Account.vue";
import ContractView from "@/components/Contract.vue";
import PageError from "@/components/PageError.vue";

import useAddress, { type Account, type Contract } from "@/composables/useAddress";
import useNotFound from "@/composables/useNotFound";

import { isAddress } from "@/utils/validators";
import useContext from "@/composables/useContext";

const { useNotFoundView, setNotFoundView } = useNotFound();

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

const authorized = computed(() => {
  return item.value?.type === "account" && item.value?.authorized;
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
