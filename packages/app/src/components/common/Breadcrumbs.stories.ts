import vueRouter from "storybook-vue3-router";

import Breadcrumbs from "./Breadcrumbs.vue";

import type { BreadcrumbItem } from "./Breadcrumbs.vue";

export default {
  title: "Common/Breadcrumbs",
  component: Breadcrumbs,
};

type Args = {
  items: BreadcrumbItem[];
};

const Template = (args: Args) => ({
  components: { Breadcrumbs },
  setup() {
    return { ...args };
  },
  template: `
    <Breadcrumbs :items="items"></Breadcrumbs>
  `,
});

export const Default = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Default.args = {
  items: [
    {
      text: "Dashboard",
      to: { name: "home" },
    },
    {
      text: "Block #123",
      to: { name: "home" },
    },
    {
      text: "Transaction 0x6f873...68",
    },
  ],
};
Default.decorators = [vueRouter()];
