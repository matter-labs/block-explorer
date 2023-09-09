<template>
  <div class="label-container">
    <div>
      <p class="label">{{ t("contractVerification.compilationInfo.contractName") }}</p>
      <p class="text">{{ contractName }}</p>
    </div>
    <div>
      <p class="label">{{ t("contractVerification.compilationInfo.compilerVersion") }}</p>
      <p class="text">{{ verificationRequest?.compilerSolcVersion || verificationRequest?.compilerVyperVersion }}</p>
    </div>
    <div>
      <p class="label">
        {{
          verificationRequest?.compilerVyperVersion
            ? t("contractVerification.compilationInfo.zkvyperVersion")
            : t("contractVerification.compilationInfo.zksolcVersion")
        }}
      </p>
      <p class="text">
        {{ verificationRequest?.compilerZksolcVersion || verificationRequest?.compilerZkvyperVersion }}
      </p>
    </div>
    <div>
      <p class="label">{{ t("contractVerification.compilationInfo.optimization") }}</p>
      <p class="text">{{ optimization }}</p>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import type { Contract } from "@/composables/useAddress";
import type { PropType } from "vue";

const { t } = useI18n();

const props = defineProps({
  contract: {
    type: Object as PropType<Contract>,
    default: () => ({}),
    required: true,
  },
});
const verificationRequest = computed(() => props.contract.verificationInfo?.request);
const optimization = computed(() => (props.contract.verificationInfo?.request.optimizationUsed ? "Yes" : "No"));
const contractName = computed(() => props.contract.verificationInfo?.request.contractName.replace(/.*\.(sol|vy):/, ""));
</script>
<style lang="scss" scoped>
.label-container {
  @apply flex flex-col gap-4 sm:flex-row;
}
.label {
  @apply font-bold text-neutral-600;
}
.text {
  @apply max-w-[16rem] break-all;
}
</style>
