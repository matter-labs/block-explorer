import { action } from "@storybook/addon-actions";

import UploadFile from "./UploadFile.vue";

import type { Meta } from "@storybook/vue3";

export default {
  title: "Common/UploadFile",
  component: UploadFile,
} as Meta<typeof UploadFile>;

const Template = (args: Record<string, unknown>) => ({
  components: { UploadFile },
  setup() {
    return { args, updateValue: action("@update:value") };
  },
  template: `<upload-file v-bind="args" @update:value="updateValue" />`,
});

export const Default = Template.bind({}) as unknown as { args: Record<string, unknown> };
Default.args = {
  accept: "",
};

export const WithCustomLabel = (args: Record<string, unknown>) => ({
  components: { UploadFile },
  setup() {
    return { args, updateValue: action("@update:value") };
  },
  template: `<upload-file v-slot="obj" v-bind="args" @update:value="updateValue"><label :for="obj.for" class="cursor-pointer underline">File Upload</label></upload-file>`,
});
WithCustomLabel.args = {
  accept: "*",
};

export const WithCustomAccept = (args: Record<string, unknown>) => ({
  components: { UploadFile },
  setup() {
    return { args, updateValue: action("@update:value") };
  },
  template: `<upload-file v-bind="args" @update:value="updateValue" />`,
});
WithCustomAccept.args = {
  accept: ".json",
};
