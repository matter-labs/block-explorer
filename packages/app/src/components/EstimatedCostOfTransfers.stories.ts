import EstimatedCostOfTransfers, { type Cost } from "./EstimatedCostOfTransfers.vue";

export default {
  title: "components/EstimatedCostOfTransfers",
  component: EstimatedCostOfTransfers,
};

type Args = {
  costs: Cost[];
};

const costs: Cost[] = [
  {
    label: "Activation Fee",
    value: 44.5,
    description: "Description",
  },
  {
    label: "Transfer",
    value: 0.76,
  },
  {
    label: "MintNFT",
    value: 25,
  },
  {
    label: "Withdraw",
    value: 63,
  },
];

const Template = (args: Args) => ({
  components: { EstimatedCostOfTransfers },
  setup() {
    return { args };
  },
  template: `<estimated-cost-of-transfers v-bind="args" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = { costs };
