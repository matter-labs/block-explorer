<template>
  <div class="contract-bytecode-container">
    <div class="verified-contract-container" v-if="!contract.verificationInfo">
      <div>
        <div class="title">{{ t("contract.bytecode.areYouAnOwner") }}</div>
        <div class="description">
          {{ t("contract.bytecode.verifyAndPublishToday") }}
          <span>{{ contract.address }}</span>
        </div>
      </div>
      <div class="contract-link-container">
        <Button
          class="contract-verification-link"
          :data-testid="$testId.contractVerificationButton"
          tag="RouterLink"
          :to="{ name: 'contract-verification', query: { address: contract.address } }"
        >
          {{ t("contract.bytecode.verifyButton") }}
        </Button>
      </div>
    </div>
    <div v-else class="functions-contract-container">
      <CompilationInfo :contract="contract" />
    </div>
    <div class="source-blocks-container">
      <div v-if="sourceCode" class="source-code-container">
        <div class="info-field-label">{{ t("contract.sourceCode.label") }}</div>
        <CodeBlock v-for="(item, index) in sourceCode" :key="index" :code="item.code" :label="item.label" />
      </div>
      <div class="bytecode-field-container">
        <div class="info-field-label">{{ t("contract.bytecode.deployedBytecode") }}</div>
        <div class="bytecode">
          <ByteData :value="contract.bytecode" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import Button from "@/components/common/Button.vue";
import ByteData from "@/components/common/table/fields/ByteData.vue";
import CodeBlock from "@/components/contract/CodeBlock.vue";
import CompilationInfo from "@/components/contract/CompilationInfo.vue";

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

const sourceCode = computed<undefined | { code: string; label: string }[]>(() => {
  if (!props.contract?.verificationInfo) {
    return undefined;
  }
  const request = props.contract.verificationInfo.request;
  if (request.compilerZkvyperVersion) {
    const sourceCode = request.sourceCode as Record<string, string>;
    const contractNames = Object.keys(sourceCode);
    if (contractNames.length === 1) {
      return [{ code: sourceCode[contractNames[0]], label: t("contract.sourceCode.singleFileContract") }];
    }
    return Object.entries(sourceCode).map(([key, value], index, arr) => {
      return {
        code: value,
        label: t("contract.sourceCode.fileLabel", {
          index: index + 1,
          total: arr.length,
          fileName: key.split("/").pop(),
        }),
      };
    });
  }
  if (typeof request.sourceCode === "string") {
    return [{ code: request.sourceCode, label: t("contract.sourceCode.singleFileContract") }];
  } else {
    return Object.entries(request.sourceCode.sources).map(([key, value], index, arr) => {
      return {
        code: value.content,
        label: t("contract.sourceCode.fileLabel", {
          index: index + 1,
          total: arr.length,
          fileName: key.split("/").pop(),
        }),
      };
    });
  }
});
</script>

<style scoped lang="scss">
.contract-bytecode-container {
  @apply rounded-b-lg bg-white py-4;
  .verified-contract-container {
    @apply mb-6 flex flex-col justify-between text-sm md:mb-10 md:flex-row md:text-base;
    .title {
      @apply mb-1 text-base font-bold text-neutral-900;
    }
    .description {
      @apply whitespace-pre-line text-neutral-600;
      span {
        @apply break-words font-bold;
      }
    }
    .contract-link-container {
      @apply mt-5 flex items-end md:mt-0;
      .contract-verification-link {
        @apply whitespace-nowrap md:px-5 md:py-3;
      }
    }
  }
  .functions-contract-container {
    @apply mb-6 md:mb-10;
    .functions-grid {
      @apply sm:grid-cols-2;
    }
  }
  .source-blocks-container {
    @apply grid gap-4;

    .info-field-label {
      @apply text-sm font-bold text-neutral-700;
    }
    .source-code-container,
    .bytecode-field-container {
      @apply grid grid-cols-1 gap-2;
    }
  }
}
</style>
