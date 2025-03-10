<template>
  <Button
    class="contract-verification-link"
    :data-testid="$testId.contractVerificationButton"
    tag="RouterLink"
    :to="{ name: 'contract-verification', query: { address } }"
  >
    {{ t("contract.bytecode.verifyButton") }}
  </Button>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import Button from "@/components/common/Button.vue";

import type { Address } from "@/types";
import type { PropType } from "vue";

defineProps({
  address: {
    type: Object as PropType<Address>,
    default: () => ({}),
    required: true,
  },
});

const { t } = useI18n();
</script>

<style>
.contract-verification-link {
  @apply whitespace-nowrap md:px-5 md:py-3;
}
</style>
