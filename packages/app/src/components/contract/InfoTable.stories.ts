import InfoTable from "./InfoTable.vue";

import type { Contract } from "@/composables/useAddress";

export default {
  title: "Contract/InfoTable",
  component: InfoTable,
};

type Args = {
  contract: Contract;
  loading: boolean;
};

const contract: Contract = {
  address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
  creatorAddress: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
  creatorTxHash: "0xc3751ea2572cb6b4f061af1127a67eaded2cfc191f2a18d69000bbe2e98b680a",
  createdInBlockNumber: 61223,
  totalTransactions: 31231,
  balances: {},
} as Contract;

const Template = (args: Args) => ({
  components: { InfoTable },
  setup() {
    return { ...args };
  },
  template: `
   <InfoTable :contract="contract" :loading="loading" />
  `,
});

export const Default = Template.bind({}) as unknown as { args: Args };

Default.args = {
  contract,
  loading: false,
};

export const Loading = Template.bind({}) as unknown as { args: Args };
Loading.args = {
  contract,
  loading: true,
};
