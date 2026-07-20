<template>
  <div class="verification-alert-container" v-if="autoVerified">
    <Alert type="notification">
      {{ t("contractVerification.compilationInfo.autoVerified") }}
      <AddressLink :address="contract.address">{{ shortValue(contract.address) }}</AddressLink>
    </Alert>
  </div>
  <div class="verification-alert-container" v-if="partialVerification">
    <Alert type="warning">
      {{ t("contractVerification.compilationInfo.partialVerification") }}
      <a :href="PARTIAL_VERIFICATION_DETAILS_URL">{{
        t("contractVerification.compilationInfo.partialVerificationDetails")
      }}</a>
    </Alert>
  </div>

  <div v-if="partialVerification || autoVerified">
    <VerificationButton :address="contract.address" />
  </div>
  <div class="label-container">
    <div>
      <p class="label">{{ t("contractVerification.compilationInfo.contractName") }}</p>
      <p class="text">{{ contractName }}</p>
    </div>
    <div>
      <p class="label">
        {{
          verificationInfo?.compilation.language === "Vyper"
            ? t("contractVerification.compilationInfo.vyperVersion")
            : t("contractVerification.compilationInfo.solcVersion")
        }}
      </p>
      <p class="text">{{ verificationInfo?.compilation.compilerVersion }}</p>
    </div>
    <div>
      <p class="label">
        {{ t("contractVerification.compilationInfo.evmVersion") }}
      </p>
      <p class="text">
        {{ verificationInfo?.compilation.compilerSettings.evmVersion }}
      </p>
    </div>
    <div>
      <p class="label">{{ t("contractVerification.compilationInfo.optimization.title") }}</p>
      <p class="text" v-if="optimizationInfo.enabled">
        <span>{{ t("contractVerification.compilationInfo.optimization.enabled") }}</span>
        <span v-if="optimizationInfo.runs">
          {{
            t("contractVerification.compilationInfo.optimization.runsTemplate", {
              runs: optimizationInfo.runs,
            })
          }}
        </span>
      </p>
      <p class="text" v-else>{{ t("contractVerification.compilationInfo.optimization.disabled") }}</p>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import AddressLink from "../AddressLink.vue";

import Alert from "@/components/common/Alert.vue";
import VerificationButton from "@/components/contract/VerificationButton.vue";

import type { Contract } from "@/composables/useAddress";
import type { PropType } from "vue";

import { shortValue } from "@/utils/formatters";

const { t } = useI18n();

const props = defineProps({
  contract: {
    type: Object as PropType<Contract>,
    default: () => ({}),
    required: true,
  },
});
const verificationInfo = computed(() => props.contract.verificationInfo);
const optimizationInfo = computed(() => {
  const optimizer = props.contract.verificationInfo?.compilation.compilerSettings.optimizer;
  return (
    optimizer || {
      enabled: false,
    }
  );
});
const contractName = computed(() =>
  props.contract.verificationInfo?.compilation.fullyQualifiedName.replace(/.*\.(sol|vy):/, "")
);
// TODO: implement auto-verification
const autoVerified = computed(() => false);
const partialVerification = computed(() => {
  return props.contract.verificationInfo?.match && props.contract.verificationInfo.match !== "exact_match";
});

const PARTIAL_VERIFICATION_DETAILS_URL =
  "https://ethereum.org/en/developers/docs/smart-contracts/verifying/#full-verification";
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
.verification-alert-container {
  @apply mb-2 w-full;
}
</style>
