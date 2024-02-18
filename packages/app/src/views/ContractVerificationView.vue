<template>
  <div>
    <div class="head-block">
      <Breadcrumbs :items="breadcrumbItems" />
      <SearchForm class="search-form" />
    </div>
    <h1>{{ t("contractVerification.title") }}</h1>
    <p class="subtitle">{{ t("contractVerification.subtitle") }}</p>
    <ContentCard
      v-if="contractVerificationStatus !== 'successful'"
      tag="form"
      class="form-container"
      autocomplete="off"
      @submit.prevent="submitForm"
    >
      <Alert type="notification" class="full-grid-width">
        <i18n-t scope="global" keypath="contractVerification.resources.title" tag="span">
          <template #hardhat>
            <a @click="changeLink(1)" class="btn-link">
                {{ t("contractVerification.resources.links.hardhat") }}
              </a>
          </template>
        </i18n-t>
      </Alert>

      <div v-if="compilationErrors.length" class="compilation-error-container">
        <div class="compilation-error">
          <ExclamationIcon class="compilation-error-icon" aria-hidden="true" />
          <span>{{ t("contractVerification.compilationError.title") }}</span>
        </div>
        <ExpandableText class="compilation-error-log">
          <template #default>
            <pre v-for="(item, index) in compilationErrors" :key="index">{{ item }}</pre>
          </template>
          <template #button="{ expanded }">
            {{
              expanded
                ? t("contractVerification.compilationError.showLessButton")
                : t("contractVerification.compilationError.showMoreButton")
            }}
          </template>
        </ExpandableText>
      </div>
      <Alert v-else-if="isRequestFailed || contractVerificationErrorMessage" class="error-alert">
        {{
          contractVerificationErrorMessage
            ? contractVerificationErrorMessage
            : t("contractVerification.form.unknownError")
        }}
      </Alert>

      <h3 class="form-subheading">{{ t("contractVerification.form.contractAddress.title") }}</h3>
      <FormItem id="contractAddress" class="half-grid-width">
        <Input
          id="contractAddress"
          type="text"
          :disabled="isRequestPending"
          :placeholder="t('contractVerification.form.contractAddress.placeholder')"
          :error="
            v$.contractAddress.$error
              ? v$.contractAddress.$errors[0] && v$.contractAddress.$errors[0].$message.toString()
              : undefined
          "
          v-model="form.contractAddress"
        />
        <template #underline>{{ t("contractVerification.form.contractAddress.underline") }}</template>
      </FormItem>

      <h3 class="form-subheading">{{ t("contractVerification.form.compilationInfo") }}</h3>
      <FormItem id="compilerType" :label="t('contractVerification.form.compilerType.label')">
        <Dropdown
          v-model="selectedCompilationType"
          id="compilerType"
          :options="Object.values(CompilationTypeOptionsEnum)"
          :formatter="(val) => t(`contractVerification.form.compilerType.${val}`)"
          @update:model-value="onCompilationTypeChange"
        />
        <template #underline>{{ t("contractVerification.form.compilerType.underline") }}</template>
      </FormItem>
      <div class="contract-dropdowns-container half-grid-width">
        <FormItem
          id="zkCompilerVersion"
          :label="t(`contractVerification.form.${selectedZkCompiler.name}Version.label`)"
          class="label-inline-block"
        >
          <a @click="changeLink(2)"
            class="docs-link"
            >{{ t(`contractVerification.form.${selectedZkCompiler.name}Version.details`) }}</a
          >
          <Dropdown
            class="clear-both"
            v-model="selectedZkCompilerVersion"
            id="zkCompilerVersion"
            :pending="selectedZkCompiler.isRequestPending"
            :default-option="defaultValues.zkCompilerVersion"
            :options="selectedZkCompiler.versions"
            :disabled="selectedZkCompiler.isRequestFailed"
            :error="
              v$.zkCompilerVersion.$error || selectedZkCompiler.isRequestFailed
                ? t(`contractVerification.form.${selectedZkCompiler.name}Version.error`)
                : ''
            "
          />
        </FormItem>
        <FormItem
          id="compilerVersion"
          :label="t(`contractVerification.form.${selectedCompiler.name}Version.label`)"
          class="label-inline-block"
        >
          <CheckBoxInput
            v-if="selectedCompiler.name === CompilerEnum.solc"
            v-model="isZkVMSolcCompiler"
            @update:model-value="onZkVMSelectionChanged"
            >{{ t("contractVerification.form.solcVersion.zkVM") }}</CheckBoxInput
          >
          <Dropdown
            class="clear-both"
            v-model="selectedCompilerVersion"
            id="compilerVersion"
            :pending="selectedCompiler.isRequestPending"
            :default-option="defaultValues.compilerVersion"
            :options="selectedCompiler.versions"
            :disabled="selectedCompiler.isRequestFailed"
            :error="
              v$.compilerVersion.$error || selectedCompiler.isRequestFailed
                ? t(`contractVerification.form.${selectedCompiler.name}Version.error`)
                : ''
            "
          />
        </FormItem>
      </div>
      <FormItem tag="fieldset" :label="t('contractVerification.form.optimizationUsed.label')" label-tag="legend">
        <div class="grid w-max grid-cols-2 items-center gap-4" :data-testid="$testId.optimizationRadioButtons">
          <RadioInput
            id="optimization-yes"
            name="optimization"
            :disabled="isRequestPending"
            :value="true"
            v-model="form.optimizationUsed"
          >
            {{ t("contractVerification.form.optimizationUsed.options.yes") }}
          </RadioInput>
          <RadioInput
            id="optimization-no"
            name="optimization"
            :disabled="isRequestPending"
            :value="false"
            v-model="form.optimizationUsed"
          >
            {{ t("contractVerification.form.optimizationUsed.options.no") }}
          </RadioInput>
        </div>
        <template #underline>{{ t("contractVerification.form.optimizationUsed.underline") }}</template>
      </FormItem>

      <h3 class="form-subheading">Contract info</h3>
      <FormItem id="contractName" :label="t('contractVerification.form.contractName.label')">
        <Input
          id="contractName"
          type="text"
          :disabled="isRequestPending"
          :placeholder="t('contractVerification.form.contractName.placeholder')"
          :error="
            v$.contractName.$error
              ? v$.contractName.$errors[0] && v$.contractName.$errors[0].$message.toString()
              : undefined
          "
          v-model="form.contractName"
        />
        <template #underline>{{
          t(`contractVerification.form.contractName.${selectedCompiler.name}Underline`)
        }}</template>
      </FormItem>
      <FormItem v-if="isFilePathRequired" id="contractPath" :label="t('contractVerification.form.contractPath.label')">
        <Input
          id="contractPath"
          type="text"
          :disabled="isRequestPending"
          :placeholder="t(`contractVerification.form.contractPath.${selectedCompiler.name}Placeholder`)"
          :error="
            v$.contractPath.$error
              ? v$.contractPath.$errors[0] && v$.contractPath.$errors[0].$message.toString()
              : undefined
          "
          v-model="form.contractPath"
        />
        <template #underline>{{ t("contractVerification.form.contractPath.underline") }}</template>
      </FormItem>
      <FormItem
        v-if="isSingleFile"
        class="full-grid-width"
        id="sourceCode"
        :label="t(`contractVerification.form.sourceCode.${selectedCompiler.name}Label`)"
      >
        <SolidityEditor
          id="sourceCode"
          :disabled="isRequestPending"
          :error="
            v$.sourceCode.$error ? v$.sourceCode.$errors[0] && v$.sourceCode.$errors[0].$message.toString() : undefined
          "
          v-model="form.sourceCode"
        />
        <i18n-t
          v-if="selectedCompiler.name === CompilerEnum.solc"
          scope="global"
          keypath="contractVerification.form.flattenerInfo.title"
          tag="p"
          class="flattener-info"
        >
          <template #flattener>
            <a href="https://github.com/BlockCatIO/solidity-flattener" target="_blank">
              {{ t("contractVerification.form.flattenerInfo.solidityFlattener") }}
            </a>
          </template>
          <template #flattery>
            <a href="https://github.com/DaveAppleton/SolidityFlattery" target="_blank">
              {{ t("contractVerification.form.flattenerInfo.solidityFlattery") }}
            </a>
          </template>
        </i18n-t>
      </FormItem>
      <MultiFileVerification
        v-else
        v-model:files="form.files"
        v-model:main-file="form.mainFileName"
        :compiler="selectedCompiler.name"
        :disabled="isRequestPending"
        :error-files="v$.files.$error ? v$.files.$errors[0] && v$.files.$errors[0].$message.toString() : ''"
        :error-main-file="
          v$.mainFileName.$error ? v$.mainFileName.$errors[0] && v$.mainFileName.$errors[0].$message.toString() : ''
        "
        class="full-grid-width"
      />
      <FormItem
        class="full-grid-width"
        id="constructorArguments"
        :label="t('contractVerification.form.constructorArguments.label')"
      >
        <Input
          id="constructorArguments"
          type="text"
          :disabled="isRequestPending"
          :placeholder="t('contractVerification.form.constructorArguments.placeholder')"
          v-model="form.constructorArguments"
        />
      </FormItem>

      <div class="form-divider"></div>

      <div class="form-footer half-grid-width">
        <Button type="submit" :loading="isRequestPending" :disabled="disabledSubmitButton">
          {{
            isRequestPending
              ? t("contractVerification.form.buttonVerifying")
              : t("contractVerification.form.buttonVerify")
          }}
        </Button>
        <Button variant="outlined" :disabled="disabledClearButton" @click="clearForm">
          {{ t("contractVerification.form.buttonClear") }}
        </Button>
      </div>
    </ContentCard>
    <SuccessScreen v-else class="content-container" :contract-address="(form.contractAddress as Address)" />
    <AskGotoZksyncDialog 
        :outsideLink="linkAddress"
        :opened="isShowPopUp"  
        @close="closeModal" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import { ExclamationIcon } from "@heroicons/vue/outline";
import { useVuelidate } from "@vuelidate/core";
import { createI18nMessage, required } from "@vuelidate/validators";

import ContentCard from "@/components/ContentCard.vue";
import SearchForm from "@/components/SearchForm.vue";
import SolidityEditor from "@/components/SolidityEditor.vue";
import Alert from "@/components/common/Alert.vue";
import Breadcrumbs from "@/components/common/Breadcrumbs.vue";
import Button from "@/components/common/Button.vue";
import CheckBoxInput from "@/components/common/CheckBoxInput.vue";
import Dropdown from "@/components/common/Dropdown.vue";
import ExpandableText from "@/components/common/ExpandableText.vue";
import Input from "@/components/common/Input.vue";
import RadioInput from "@/components/common/RadioInput.vue";
import MultiFileVerification from "@/components/contract/verification/MultiFileVerification.vue";
import SuccessScreen from "@/components/contract/verification/SuccessScreen.vue";
import FormItem from "@/components/form/FormItem.vue";
import AskGotoZksyncDialog from "@/components/AskGotoZksyncDialog.vue";

import useContractVerification from "@/composables/useContractVerification";

import type { BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";

import {
  type Address,
  CompilationTypeOptionsEnum,
  CompilerEnum,
  ContractVerificationCodeFormatEnum,
  type ContractVerificationData,
} from "@/types";
import { isAddress } from "@/utils/validators";

const compilerTypeMap = {
  [CompilationTypeOptionsEnum.soliditySingleFile]: {
    compiler: CompilerEnum.solc,
    zkCompiler: CompilerEnum.zksolc,
  },
  [CompilationTypeOptionsEnum.solidityMultiPart]: {
    compiler: CompilerEnum.solc,
    zkCompiler: CompilerEnum.zksolc,
  },
  [CompilationTypeOptionsEnum.vyperSingleFile]: {
    compiler: CompilerEnum.vyper,
    zkCompiler: CompilerEnum.zkvyper,
  },
  [CompilationTypeOptionsEnum.vyperMultiPart]: {
    compiler: CompilerEnum.vyper,
    zkCompiler: CompilerEnum.zkvyper,
  },
};

const route = useRoute();
const { t } = useI18n();
const withI18nMessage = createI18nMessage({ t });
const {
  isRequestPending,
  isRequestFailed,
  contractVerificationErrorMessage,
  compilationErrors,
  contractVerificationStatus,
  requestVerification,
  requestCompilerVersions,
  compilerVersions,
} = useContractVerification();
const zkVMVersionPrefix = "zkVM";

requestCompilerVersions(CompilerEnum.zksolc);
requestCompilerVersions(CompilerEnum.solc);
requestCompilerVersions(CompilerEnum.zkvyper);
requestCompilerVersions(CompilerEnum.vyper);

const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    text: t("breadcrumbs.home"),
    to: { name: "home" },
  },
  {
    text: `${t("contractVerification.title")}`,
  },
]);

const isZkVMSolcCompiler = ref(false);
const isShowPopUp=ref(false)
const linkAddress=ref('')
const closeModal=()=>{
  isShowPopUp.value=false
  
}
const changeLink=(val:number)=>{
  isShowPopUp.value=true;
  if(val===1){
    linkAddress.value = "https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-verify.html"
  }else{
    linkAddress.value = "https://docs.zksync.io/build/tooling/block-explorer/contract-verification.html#user-interface"
  }
  
    
}
const selectedCompilationType = ref(CompilationTypeOptionsEnum.soliditySingleFile);
const isSingleFile = computed(() =>
  [CompilationTypeOptionsEnum.soliditySingleFile, CompilationTypeOptionsEnum.vyperSingleFile].includes(
    selectedCompilationType.value
  )
);
const selectedZkCompiler = computed(() => {
  const compiler = compilerTypeMap[selectedCompilationType.value].zkCompiler;
  return compilerVersions.value[compiler];
});
const selectedCompiler = computed(() => {
  const compiler = compilerTypeMap[selectedCompilationType.value].compiler;
  const compilerInfo = compilerVersions.value[compiler];
  if (compiler === CompilerEnum.solc) {
    return {
      ...compilerInfo,
      versions: compilerInfo.versions?.filter((version) =>
        isZkVMSolcCompiler.value ? version.startsWith(zkVMVersionPrefix) : !version.startsWith(zkVMVersionPrefix)
      ),
    };
  }
  return compilerInfo;
});
const selectedZkCompilerVersion = ref(
  selectedZkCompiler.value.versions[selectedZkCompiler.value.versions.length - 1] || ""
);
const selectedCompilerVersion = ref(selectedCompiler.value.versions[selectedCompiler.value.versions.length - 1] || "");

const disabledSubmitButton = computed(() => {
  return isRequestPending.value || selectedZkCompiler.value.isRequestPending || selectedCompiler.value.isRequestPending;
});
const disabledClearButton = computed(() => {
  return (
    isRequestPending.value ||
    selectedZkCompiler.value.isRequestPending ||
    selectedZkCompiler.value.isRequestFailed ||
    selectedCompiler.value.isRequestPending ||
    selectedCompiler.value.isRequestFailed
  );
});

const defaultValues = computed<
  ContractVerificationData & { contractPath: string; sourceCode: string; files: File[]; mainFileName: string }
>(() => {
  return {
    codeFormat: ContractVerificationCodeFormatEnum.soliditySingleFile,
    contractAddress: "",
    contractName: "",
    contractPath: "",
    optimizationUsed: true,
    zkCompilerVersion: selectedZkCompiler.value.versions[0] || "",
    compilerVersion: selectedCompiler.value.versions[0] || "",
    sourceCode: "",
    constructorArguments: "",
    files: [],
    mainFileName: "",
  };
});

const form = ref(
  Object.assign({}, defaultValues.value, {
    contractAddress: route.query.address ?? defaultValues.value.contractAddress,
  })
);

const isFilePathRequired = computed(() => {
  if (selectedCompiler.value.name === CompilerEnum.vyper) {
    return false;
  }
  if (selectedCompilationType.value === CompilationTypeOptionsEnum.solidityMultiPart) {
    return false;
  }
  if (!selectedZkCompilerVersion.value) {
    return true;
  }
  const targetVersion = "v1.3.6";

  // remove 'v' prefix for correct comparison
  const selected = selectedZkCompilerVersion.value.slice(1);
  const target = targetVersion.slice(1);

  // localeCompare returns 0 if versions are equal, 1 if selected > target, and -1 otherwise
  // so we check if the result is 0 or 1
  return selected.localeCompare(target, undefined, { numeric: true, sensitivity: "base" }) >= 0;
});

const v$ = useVuelidate(
  {
    contractAddress: {
      required: withI18nMessage(required, {
        messagePath: () => "contractVerification.form.contractAddress.validation.required",
      }),
      isContractAddress: withI18nMessage(isAddress, {
        messagePath: () => "contractVerification.form.contractAddress.validation.not_valid",
      }),
    },
    contractName: {
      required: withI18nMessage(required, {
        messagePath: () => "contractVerification.form.contractName.validation.required",
      }),
    },
    contractPath: {
      required: withI18nMessage(
        (value?: string) => {
          if (!isFilePathRequired.value) {
            return true;
          }
          return !!value?.trim();
        },
        {
          messagePath: () => "contractVerification.form.contractPath.validation.required",
        }
      ),
    },
    zkCompilerVersion: {
      required: withI18nMessage(required, {
        messagePath: () => `contractVerification.form.${selectedZkCompiler.value.name}Version.validation.required`,
      }),
    },
    compilerVersion: {
      required: withI18nMessage(required, {
        messagePath: () => `contractVerification.form.${selectedCompiler.value.name}Version.validation.required`,
      }),
    },
    sourceCode: {
      required: withI18nMessage(
        (value?: string) => {
          if (!isSingleFile.value) {
            return true;
          }
          return !!value?.trim();
        },
        {
          messagePath: () => "contractVerification.form.sourceCode.validation.required",
        }
      ),
    },
    mainFileName: {
      required: withI18nMessage(
        (value: string) => {
          if (isSingleFile.value || selectedCompilationType.value === CompilationTypeOptionsEnum.vyperMultiPart) {
            return true;
          }
          return !!value.trim();
        },
        {
          messagePath: () => "contractVerification.multiFileVerification.mainFile.validation.required",
        }
      ),
    },
    files: {
      required: withI18nMessage(
        (value: File[]) => {
          if (isSingleFile.value) {
            return true;
          }
          return !!value.length;
        },
        {
          messagePath: () => "contractVerification.multiFileVerification.files.validation.required",
        }
      ),
    },
  },
  form
);

function onZkVMSelectionChanged() {
  selectedCompilerVersion.value = selectedCompiler.value.versions[0] || "";
}

function onCompilationTypeChange() {
  selectedZkCompilerVersion.value = selectedZkCompiler.value.versions[0] || "";
  selectedCompilerVersion.value = selectedCompiler.value.versions[0] || "";
}
function clearForm() {
  form.value = Object.assign({}, defaultValues.value);
  selectedZkCompilerVersion.value = "";
  selectedCompilerVersion.value = "";
  v$.value.$reset();
}
async function submitForm() {
  form.value.zkCompilerVersion = selectedZkCompilerVersion.value || defaultValues.value.zkCompilerVersion;
  form.value.compilerVersion = selectedCompilerVersion.value || defaultValues.value.compilerVersion;
  const validationResult = await v$.value.$validate();
  if (!validationResult) {
    return;
  }
  const commonData = {
    codeFormat: ContractVerificationCodeFormatEnum[selectedCompilationType.value],
    contractAddress: form.value.contractAddress,
    optimizationUsed: form.value.optimizationUsed,
    zkCompilerVersion: form.value.zkCompilerVersion,
    compilerVersion: form.value.compilerVersion,
    constructorArguments: form.value.constructorArguments,
  };
  if (isSingleFile.value) {
    await requestVerification({
      contractName: isFilePathRequired.value
        ? `${form.value.contractPath}:${form.value.contractName}`
        : form.value.contractName,
      sourceCode: form.value.sourceCode,
      ...commonData,
    });
  } else {
    const sources: Record<string, { content: string }> = {};
    await Promise.all(
      form.value.files.map(async (file) => {
        const fileContent = await file.text();
        sources[file.name] = { content: fileContent };
      })
    );
    await requestVerification({
      contractName: form.value.mainFileName
        ? `${form.value.mainFileName}:${form.value.contractName}`
        : form.value.contractName,
      sourceCode: {
        language: selectedCompiler.value.name === CompilerEnum.solc ? "Solidity" : "Vyper",
        sources,
        settings: {
          optimizer: {
            enabled: form.value.optimizationUsed,
          },
        },
      },
      ...commonData,
    });
  }
}
</script>

<style lang="scss">
.contract-verification {
  .hero-banner-container {
    @apply h-[22rem] sm:h-72 lg:h-64;
  }
}
</style>
<style lang="scss" scoped>
.head-block {
  @apply mb-8 flex flex-col-reverse justify-between lg:mb-10 lg:flex-row;

  .search-form {
    @apply mb-6 w-full max-w-[26rem] lg:mb-0;
  }
}
.subtitle {
  @apply mt-2 text-sm text-white;
}
.form-container {
  @apply md:grid-cols-4;
  .btn-link{
    cursor: pointer;
  }

  .half-grid-width {
    @apply md:col-span-2;
  }
  .full-grid-width,
  .content-title,
  .form-subheading,
  .compilation-error-container,
  .error-alert,
  .form-divider {
    @apply md:col-span-4;
  }

  .form-subheading {
    @apply text-xl text-neutral-700;
  }
  .compilation-error-container {
    @apply font-mono;

    .compilation-error {
      @apply flex items-center font-extralight text-error-500;

      .compilation-error-icon {
        @apply mr-2 h-5 w-5;
      }
    }
    .compilation-error-log {
      @apply mt-2 border-error-500;

      pre {
        @apply whitespace-pre-line;
      }
    }
  }
  .flattener-info {
    @apply mt-1 text-sm text-neutral-400;

    a {
      @apply rounded-md px-0.5 focus:outline-none focus:ring-2 focus:ring-primary-600;
    }
  }
  .form-divider {
    @apply w-full border-t;
  }
  .form-footer {
    @apply flex flex-col items-center sm:flex-row;

    .button {
      @apply w-full max-w-xs sm:w-max;
    }
    .button:nth-child(2) {
      @apply mt-2 sm:ml-4 sm:mt-0;
    }
  }
  .contract-dropdowns-container {
    @apply grid gap-4 md:grid-cols-2;
    .docs-link {
      @apply float-right rounded-md px-0.5 pt-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600;
      cursor: pointer;
    }
  }
}
</style>
