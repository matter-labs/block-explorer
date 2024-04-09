import SourceViewer from "./SourceViewer.vue";

import type { Meta } from "@storybook/vue3";

export default {
  title: "Debugger/SourceViewer",
  component: SourceViewer,
} as Meta<typeof SourceViewer>;

const Template = (args: Record<string, unknown>) => ({
  components: { SourceViewer },
  setup() {
    return { args };
  },
  template: `<SourceViewer v-bind="args" />`,
});

export const Simple = Template.bind({}) as unknown as { args: Record<string, unknown> };
Simple.args = {
  address: "0x00",
  source: ["Hello", "World", "."],
};

export const WithScroll = Template.bind({}) as unknown as { args: Record<string, unknown> };
WithScroll.args = {
  address: "0x00",
  source: Array.from({ length: 1000 }).map((_, index) => `Hello World ${index}`),
};

export const WithNesting = Template.bind({}) as unknown as { args: Record<string, unknown> };
WithNesting.args = {
  address: "0x00",
  source: Array.from({ length: 10 }).reduce<string[]>((obj, _, index) => {
    obj.push(`// Function # ${index}`);
    obj.push(".func_begin");
    obj.push("Hello");
    obj.push("World");
    obj.push("!");
    obj.push(".func_end");
    obj.push("");
    return obj;
  }, []),
};

export const WithHighlighted = Template.bind({}) as unknown as { args: Record<string, unknown> };
WithHighlighted.args = {
  address: "0x00",
  source: Array.from({ length: 10 }).reduce<string[]>((obj, _, index) => {
    obj.push(`// Function # ${index}`);
    obj.push(".func_begin");
    obj.push("Hello");
    obj.push("World");
    obj.push("!");
    obj.push(".func_end");
    obj.push("");
    return obj;
  }, []),
  activeStep: {
    address: "0x00",
    line: 18,
    step: {},
  },
};
