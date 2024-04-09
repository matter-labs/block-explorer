import vueRouter from "storybook-vue3-router";

import BlocksTable from "./Table.vue";

import type { BlockListItem } from "@/composables/useBlock";

export default {
  title: "Blocks/Table",
  component: BlocksTable,
};

type Args = {
  blocks: BlockListItem[];
  loading: boolean;
  footer?: string;
};

const Template = (args: Args) => ({
  components: { BlocksTable },
  setup() {
    return { ...args };
  },
  template: `
    <BlocksTable :loading="loading" :blocks="blocks">
      <template v-if="footer" #footer>
        <div v-html="footer"></div>
      </template>
    </BlocksTable>
  `,
});

const routes = vueRouter([
  { path: "/", name: "home", component: {} },
  { path: "/block", name: "block", component: {} },
]);

const blocks: BlockListItem[] = [
  {
    number: 9005,
    l1TxCount: 0,
    l2TxCount: 30,
    hash: "0x36e619bc0adc94cd0bc1927054cfb560b519576d12490e7f898d48880e3a8bc2",
    status: "sealed",
    timestamp: "1645606702",
    gasUsed: "1000",
    l1BatchNumber: 10,
    size: 20,
    isL1BatchSealed: true,
  },
  {
    number: 9004,
    l1TxCount: 0,
    l2TxCount: 27,
    hash: "0xef76deed76769be2af767bda6375a27300d0efec2c00a2b794a5ea09bb1fb610",
    status: "verified",
    timestamp: "1645606702",
    gasUsed: "1000",
    l1BatchNumber: 15,
    size: 30,
    isL1BatchSealed: true,
  },
  {
    number: 9003,
    l1TxCount: 0,
    l2TxCount: 20,
    hash: "0x672f9a4f3bf34d10ab65dbc86a10f74ad01e27e2d8322719ff5aa1d1b527cd45",
    status: "verified",
    timestamp: "1645606701",
    gasUsed: "1000",
    l1BatchNumber: 20,
    size: 40,
    isL1BatchSealed: true,
  },
  {
    number: 9002,
    l1TxCount: 0,
    l2TxCount: 47,
    hash: "0xe4312f6845fa455b3a5bf74a0544a43f15f97e38710abe2794e14ce5aa7e374b",
    status: "verified",
    timestamp: "1645606701",
    gasUsed: "1000",
    l1BatchNumber: 25,
    size: 50,
    isL1BatchSealed: false,
  },
  {
    number: 9001,
    l1TxCount: 0,
    l2TxCount: 58,
    hash: "0x01ee8af7626f87e046f212c59e4505ef64d3fa5746db26bec7b46566420321f3",
    status: "verified",
    timestamp: "1645606700",
    gasUsed: "1000",
    l1BatchNumber: 30,
    size: 60,
    isL1BatchSealed: false,
  },
];

export const Default = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Default.args = {
  blocks,
  loading: false,
  footer: undefined,
};
Default.decorators = [routes];

export const WithFooter = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
WithFooter.args = {
  blocks,
  loading: false,
  footer: `<div class="py-2 underline text-center text-xs text-gray-500 cursor-pointer hover:text-gray-400">Show more blocks -></div>`,
};
WithFooter.decorators = [routes];

export const Loading = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Loading.args = {
  blocks,
  loading: true,
  footer: undefined,
};
Loading.decorators = [routes];
