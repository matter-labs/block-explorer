import vueRouter from "storybook-vue3-router";

import Tabs from "./Tabs.vue";

import type { Tab } from "./Tabs.vue";

export default {
  title: "Common/Tabs",
  component: Tabs,
};

type Args = {
  tabs: Tab[];
};

const Template = (args: Args) => ({
  components: { Tabs },
  setup() {
    return { ...args };
  },
  template: `
    <Tabs :tabs="tabs">
        <template #tab-1>Tab 1</template>
        <template #tab-1-content>Tab 1 Content</template>
    </Tabs>
  `,
});

export const SingleTab = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
SingleTab.args = {
  tabs: [{ title: "Tab 1", hash: "#tab1" }],
};

export const MultipleTabs = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
MultipleTabs.args = {
  tabs: [
    { title: "Tab 1", hash: "#tab1" },
    { title: "Tab 2", hash: "#tab2" },
    { title: "Tab 3", hash: "#tab3" },
  ],
};

SingleTab.decorators = [vueRouter()];
MultipleTabs.decorators = [vueRouter()];
