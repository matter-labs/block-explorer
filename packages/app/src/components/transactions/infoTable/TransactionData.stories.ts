import TransactionDataComponent from "@/components/transactions/infoTable/TransactionData.vue";

import type { TransactionData } from "@/composables/useTransactionData";

export default {
  title: "Transactions/TransactionData",
  component: TransactionDataComponent,
};

const transactionData = {
  contractAddress: "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b",
  calldata:
    "0xa9059cbb000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f0440000000000000000000000000000000000000000000000000000000000000001",
  value: "0x0",
  sighash: "0xa9059cbb",
  factoryDeps: null,
} as TransactionData;
const transactionDataDecodedMethod = {
  name: "transfer",
  inputs: [
    {
      name: "recipient",
      type: "address",
      value: "0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044",
      encodedValue: "000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f044",
    },
    {
      name: "amount",
      type: "uint256",
      value: "1",
      encodedValue: "0000000000000000000000000000000000000000000000000000000000000001",
    },
  ],
} as TransactionData["method"];

type Args = {
  data: TransactionData;
  loading: boolean;
  error: string;
};

const Template = (args: Args) => ({
  components: { TransactionDataComponent },
  setup() {
    return { args };
  },
  template: `
    <TransactionDataComponent v-bind="args" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  data: {
    ...transactionData,
    method: transactionDataDecodedMethod,
  },
  loading: false,
  error: "",
};

export const ContractNotVerified = Template.bind({}) as unknown as { args: Args };
ContractNotVerified.args = {
  data: transactionData,
  loading: false,
  error: "contract_not_verified",
};

export const Loading = Template.bind({}) as unknown as { args: Args };
Loading.args = {
  data: transactionData,
  loading: true,
  error: "",
};
