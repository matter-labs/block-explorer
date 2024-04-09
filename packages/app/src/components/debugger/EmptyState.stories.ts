import { action } from "@storybook/addon-actions";

import EmptyState from "./EmptyState.vue";

import type { Meta } from "@storybook/vue3";

export default {
  title: "Debugger/EmptyState",
  component: EmptyState,
} as Meta<typeof EmptyState>;

const Template = (args: Record<string, unknown>) => ({
  components: { EmptyState },
  setup() {
    return { args, updateValue: action("@update:value") };
  },
  template: `<div class="bg-neutral-900 p-8"><EmptyState v-bind="args" @update:value="updateValue" /></div>`,
});

export const Empty = Template.bind({}) as unknown as { args: Record<string, unknown> };
Empty.args = {};

export const WithError = Template.bind({}) as unknown as { args: Record<string, unknown> };
WithError.args = {
  hasError: true,
};
