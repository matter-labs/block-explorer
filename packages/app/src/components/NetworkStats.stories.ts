import NetworkStats from "./NetworkStats.vue";

export default {
  title: "components/NetworkStats",
  component: NetworkStats,
};

type Args = {
  committed: number | null;
  verified: number | null;
  transactions: number | null;
  totalLocked?: number | null;
  loading: boolean;
};

const Template = (args: Args) => ({
  components: { NetworkStats },
  setup() {
    return { args };
  },
  template: `<network-stats v-bind="args" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  committed: 1213944,
  verified: 1233,
  transactions: 10,
  totalLocked: 83834,
  loading: false,
};

export const WithoutTotalLocked = Template.bind({}) as unknown as { args: Args };
WithoutTotalLocked.args = {
  committed: 1213944,
  verified: 1233,
  transactions: 10,
  loading: false,
};

export const Loading = Template.bind({}) as unknown as { args: Args };
Loading.args = {
  committed: null,
  verified: null,
  transactions: null,
  totalLocked: null,
  loading: true,
};
