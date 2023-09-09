<template>
  <div class="multi-file-verification">
    <FormItem
      id="uploadFileInput"
      class="col-span-2"
      :label="t(`contractVerification.multiFileVerification.${compiler}Title`)"
    >
      <UploadFile
        :key="filesToUpload.length"
        :disabled="disabled"
        :error="errorFiles"
        class="upload-files-container"
        multiple
        :accept="compiler === CompilerEnum.vyper ? '.vy' : '.sol'"
        @update:value="upload"
      >
        <label for="uploadFileInput" class="upload-files-label">
          {{ t("contractVerification.multiFileVerification.files.label") }}
        </label>
      </UploadFile>
    </FormItem>
    <template v-if="filesToUpload.length > 0">
      <FormItem
        class="files-list col-span-2 xs:col-span-1"
        :label="t('contractVerification.multiFileVerification.yourFiles')"
      >
        <div class="xs:max-w-[45vw]" v-for="(file, index) of filesToUpload" :key="index">
          <FilePreview :name="file.name" :index="index" :disabled="disabled" @removeFile="removeFile(index)" />
        </div>
      </FormItem>
      <FormItem
        v-if="compiler === CompilerEnum.solc"
        class="col-span-2 xs:col-span-1"
        :label="t('contractVerification.multiFileVerification.mainFile.label')"
      >
        <Dropdown
          v-model="selectedMainFileName"
          :options="options"
          :class="{ empty: selectedMainFileName === mainFilePlaceholder }"
          :disabled="disabled"
          :error="errorMainFile"
          :defaultOption="selectedMainFileName"
        />
      </FormItem>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import Dropdown from "@/components/common/Dropdown.vue";
import UploadFile from "@/components/common/UploadFile.vue";
import FilePreview from "@/components/contract/verification/FilePreview.vue";
import FormItem from "@/components/form/FormItem.vue";

import type { PropType } from "vue";

import { type Compiler, CompilerEnum } from "@/types";

const props = defineProps({
  files: {
    type: Array as PropType<File[]>,
    default: () => [],
  },
  mainFile: {
    type: String,
    default: "",
  },
  compiler: {
    type: String as PropType<Compiler>,
    default: CompilerEnum.solc,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  errorFiles: {
    type: String,
    default: "",
  },
  errorMainFile: {
    type: String,
    default: "",
  },
});

const { t } = useI18n();

const emit = defineEmits<{
  (e: "update:files", value: File[]): void;
  (e: "update:mainFile", value: string): void;
}>();

const mainFilePlaceholder = computed(() => t("contractVerification.multiFileVerification.mainFile.placeholder"));
const filesToUpload = ref<File[]>(props.files);
const selectedMainFileName = ref<string>(props.mainFile ? props.mainFile : mainFilePlaceholder.value);
const options = computed(() => filesToUpload.value.map((file) => file.name));

const upload = (files: File[]) => {
  filesToUpload.value = files.reduce((acc, current) => {
    if (filesToUpload.value.find((file) => file.name === current.name) || !current.name.match(/\.(sol|vy)/)) {
      return acc;
    }
    return [...acc, current];
  }, filesToUpload.value);
};

const removeFile = (index: number) => {
  if (filesToUpload.value.length === 1 || selectedMainFileName.value === filesToUpload.value[index].name) {
    selectedMainFileName.value = mainFilePlaceholder.value;
  }
  filesToUpload.value.splice(index, 1);
};

watch([() => props.files, () => props.mainFile], ([files, mainFile]) => {
  filesToUpload.value = files;
  selectedMainFileName.value = mainFile ? mainFile : mainFilePlaceholder.value;
});

watch([filesToUpload, selectedMainFileName], ([files, mainFileName]) => {
  let mainFile = mainFileName === mainFilePlaceholder.value ? "" : mainFileName;
  emit("update:files", files);
  emit("update:mainFile", mainFile);
});
</script>

<style lang="scss">
.multi-file-verification {
  @apply grid gap-4 md:grid-cols-4;

  .title {
    @apply text-neutral-600;
  }
  .upload-files-container {
    @apply mt-2 inline-block border-0 p-0;

    .upload-files-label {
      @apply block w-max cursor-pointer rounded-md bg-neutral-200 px-4 py-2.5 text-primary-600 hover:text-primary-700;
    }
  }
  .options-list-container {
    li.options-list-item {
      @apply overflow-hidden text-ellipsis pr-8;
    }
  }
  button.toggle-button {
    @apply overflow-hidden text-ellipsis whitespace-nowrap pr-6;
  }
  .empty {
    .toggle-button {
      @apply text-neutral-400;
    }
  }

  .upload-file-input:focus ~ .upload-files-label {
    @apply ring-2 ring-primary-600;
  }
}
</style>
