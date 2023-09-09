import vueRouter from "storybook-vue3-router";

import TokenIconLabel from "./TokenIconLabel.vue";

import type { Hash } from "@/types";

export default {
  title: "Common/TokenIconLabel",
  component: TokenIconLabel,
};

type Args = {
  address: Hash;
  symbol: string;
  showLinkSymbol?: boolean;
};

const Template = (args: Args) => ({
  components: { TokenIconLabel },
  setup() {
    return { args };
  },
  template: `
    <TokenIconLabel v-bind="args" />
  `,
});
const routes = vueRouter([
  { path: "/", name: "home", component: {} },
  { path: "/address", name: "address", component: {} },
]);

export const Default = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Default.args = {
  address: "0x54a14d7559baf2c8e8fa504e019d32479739018c",
  symbol: "USDC",
};
Default.decorators = [routes];

export const WithLabel = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
WithLabel.args = {
  address: "0x54a14d7559baf2c8e8fa504e019d32479739018c",
  symbol: "USDC",
  showLinkSymbol: true,
};
WithLabel.decorators = [routes];

export const Custom = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Custom.args = {
  address: "0x54a14d7559baf2c8e8fa504e019d32479739018c",
  symbol: "LESA",
};
Custom.decorators = [routes];
