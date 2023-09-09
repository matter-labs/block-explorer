<template>
  <div class="new-prover-info-box">
    <InfoTooltipWithContent>
      <span>{{ newProverMessages[context] }}</span>
      {{ " " }}
      <span>
        <a :href="NEW_PROVER_CLI_URL" target="_blank"> {{ t("general.checkHere") }} </a>{{ "." }}
      </span>
    </InfoTooltipWithContent>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import InfoTooltipWithContent from "@/components/common/InfoTooltipWithContent.vue";

import type { PropType } from "vue";

import { NEW_PROVER_CLI_URL } from "@/utils/constants";

export type NewProverInfoContext = "transaction" | "block" | "batch";

const { t } = useI18n();

defineProps({
  context: {
    type: String as PropType<NewProverInfoContext>,
    default: "transaction",
  },
});

const newProverMessages = {
  transaction: t("transactions.table.newProverInfo"),
  block: t("blocks.table.newProverInfo"),
  batch: t("batches.table.newProverInfo"),
};
</script>

<style lang="scss">
.new-prover-info-box {
  @apply mt-2.5 rounded-md border border-gray-200 bg-gray-100 p-3;
}
</style>
