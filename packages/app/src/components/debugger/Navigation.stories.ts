import { action } from "@storybook/addon-actions";

import Navigation from "./Navigation.vue";

import type { Meta } from "@storybook/vue3";

export default {
  title: "Debugger/Navigation",
  component: Navigation,
} as Meta<typeof Navigation>;

const Template = (args: Record<string, unknown>) => ({
  components: { Navigation },
  setup() {
    return {
      goTo: action("@nav:goTo"),
      args,
    };
  },
  template: `<Navigation v-bind="args" @nav:goTo="goTo" />`,
});

export const FirstStep = Template.bind({}) as unknown as { args: Record<string, unknown> };
FirstStep.args = {
  index: 0,
  total: 20,
};

export const MiddleStep = Template.bind({}) as unknown as { args: Record<string, unknown> };
MiddleStep.args = {
  index: 10,
  total: 20,
};

export const LastStep = Template.bind({}) as unknown as { args: Record<string, unknown> };
LastStep.args = {
  index: 19,
  total: 20,
};
