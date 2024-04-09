import TransferInfo from "@/components/transactions/infoTable/TransferInfo.vue";

import type { Hash, NetworkOrigin } from "@/types";

export default {
  title: "Transactions/TransferInfo",
  component: TransferInfo,
};

type Args = {
  label: string;
  address: Hash;
  network: NetworkOrigin;
};

const Template = (args: Args) => ({
  components: { TransferInfo },
  setup() {
    return { args };
  },
  template: `
    <TransferInfo v-bind="args" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  label: "From",
  address: "0x6c10d9c1744f149d4b17660e14faa247964749c7",
  network: "L2",
};
