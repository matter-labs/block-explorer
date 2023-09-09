<template>
  <div class="upload-file" :class="{ active }" ref="dropZoneRef">
    <input
      type="file"
      id="uploadFileInput"
      name="uploadFileInput"
      class="upload-file-input"
      ref="file"
      v-bind="$attrs"
      @change="onChange"
    />
    <slot for="uploadFileInput">
      <label for="uploadFileInput" class="upload-file-label">Upload file</label>
    </slot>
    <p v-if="error" class="upload-file-error">
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { useDropZone } from "@vueuse/core";

defineProps({
  error: {
    type: String,
    default: "",
  },
});

const emit = defineEmits<{
  (e: "update:value", value: File[]): void;
}>();

const onChange = (a: Event) => {
  const target = a.target as HTMLInputElement;
  upload(target?.files ? [...target.files] : []);
};
const dropZoneRef = ref(null);

const { isOverDropZone: active } = useDropZone(dropZoneRef, (files: File[] | null) => {
  upload(files);
});

const upload = (files?: File[] | null) => {
  if (!files?.length) {
    return;
  }

  emit("update:value", files);
};
</script>

<style lang="scss" scoped>
.upload-file-input {
  @apply pointer-events-none absolute -left-96 -top-96 opacity-0;
}

.upload-file-label {
  @apply cursor-pointer font-medium text-primary-500 underline;
}
.upload-file-error {
  @apply mt-0.5 border-error-400 text-sm text-error-500;
}
</style>
