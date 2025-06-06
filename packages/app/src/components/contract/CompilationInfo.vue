<template>
  <div class="verification-alert-container" v-if="autoVerified">
    <Alert type="notification">
      {{ t("contractVerification.compilationInfo.autoVerified") }}
      <AddressLink :address="verificationRequest!.contractAddress">{{
        shortValue(verificationRequest!.contractAddress)
      }}</AddressLink>
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
      <p class="label">{{ t("contractVerification.compilationInfo.compilerVersion") }}</p>
      <p class="text">{{ verificationRequest?.compilerSolcVersion || verificationRequest?.compilerVyperVersion }}</p>
    </div>
    <div v-if="contract.isEvmLike">
      <p class="label">
        {{ t("contractVerification.compilationInfo.evmVersion") }}
      </p>
      <p class="text">
        {{ verificationRequest?.evmVersion }}
      </p>
    </div>
    <div v-else>
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
        <span v-if="optimizationInfo.mode">
          {{
            t("contractVerification.compilationInfo.optimization.modeTemplate", {
              mode: optimizationInfo.mode,
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

type OptimizationInfo = {
  enabled: boolean;
  runs?: number;
  mode?: string;
};
const props = defineProps({
  contract: {
    type: Object as PropType<Contract>,
    default: () => ({}),
    required: true,
  },
});
const verificationRequest = computed(() => props.contract.verificationInfo?.request);
const optimizationInfo = computed(() => {
  let optimizationInfo: OptimizationInfo = {
    enabled: false,
  };
  if (typeof props.contract.verificationInfo?.request?.sourceCode === "string") {
    const {
      optimizationUsed: enabled,
      optimizerRuns: runs,
      optimizerMode: mode,
    } = props.contract.verificationInfo.request;
    optimizationInfo = {
      enabled,
      runs,
      mode,
    };
  } else if (
    typeof props.contract.verificationInfo?.request?.sourceCode?.settings === "object" &&
    props.contract.verificationInfo?.request?.sourceCode?.settings?.optimizer
  ) {
    const { enabled, runs, mode } = props.contract.verificationInfo.request.sourceCode.settings.optimizer;
    optimizationInfo = {
      enabled,
      runs,
      mode,
    };
  }
  return optimizationInfo;
});
const contractName = computed(() => props.contract.verificationInfo?.request.contractName.replace(/.*\.(sol|vy):/, ""));
// If address of the contract doesn't match address in the request, the contract was verified "automatically".
const autoVerified = computed(
  () => props.contract.address.toLowerCase() !== props.contract.verificationInfo?.request.contractAddress.toLowerCase()
);
// If there are any problems with the verification, the contract is only partially verified.
const partialVerification = computed(() => {
  const problems = props.contract.verificationInfo?.verificationProblems;
  // For auto-verified contracts, we don't consider verification problems since we have the ABI
  if (autoVerified.value) {
    return false;
  }
  return problems ? problems.length > 0 : false;
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
  @apply w-full mb-2;
}
</style>
