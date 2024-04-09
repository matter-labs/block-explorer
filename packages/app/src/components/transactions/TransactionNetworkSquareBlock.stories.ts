import TransactionNetworkSquareBlock from "@/components/transactions/TransactionNetworkSquareBlock.vue";

import type { NetworkOrigin } from "@/types";

export default {
  title: "Transactions/TransactionNetworkSquareBlock",
  component: TransactionNetworkSquareBlock,
};

type Args = {
  network: NetworkOrigin;
};

const Template = (args: Args) => ({
  components: { TransactionNetworkSquareBlock },
  setup() {
    return { args };
  },
  template: `
    <TransactionNetworkSquareBlock v-bind="args" />
  `,
});

export const L1Network = Template.bind({}) as unknown as { args: Args };
L1Network.args = {
  network: "L1",
};

export const L2Network = Template.bind({}) as unknown as { args: Args };
L2Network.args = {
  network: "L2",
};
