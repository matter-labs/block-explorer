import TransactionEventTableCell from "@/components/event/TransactionEventTableCell.vue";

import type { InputType } from "@/composables/useEventLog";
import type { TransactionLogEntry } from "@/composables/useEventLog";

export default {
  title: "components/Event/TransactionEventTableCell",
  component: TransactionEventTableCell,
};

type Args = {
  item: TransactionLogEntry;
  popoverPlacement?: "top" | "bottom";
};

const item: TransactionLogEntry = {
  address: "0x4d82c246feae3f67303d2500ac9fb18fc654d151",
  topics: [
    "0x5548c837ab068cf56a2c2479df0882a4922fd203edb7517321831d95078c5f62",
    "0x0000000000000000000000001e98677895078dd55bf59236b8bc477ab4e962c3",
    "0x000000000000000000000000a2faa945acadaed59797c40f906f9936906b9621",
  ],
  data: "0x0000000000000000000000000000000000000000000000000000000005ed2d99",
  blockHash: "0xa9eccec9d479f22760f46b10572d2a7144e31f454703b30983256b666646110f",
  blockNumber: "0x2beec2",
  l1BatchNumber: "0x92260",
  transactionHash: "0xdcf4932c1f33ce1c8831eb7c0f1ba2cf0344829d5ce6ab34cf6adf214f8a2be2",
  transactionIndex: "0x2",
  logIndex: "0xa",
  transactionLogIndex: "0xa",
  logType: null,
  removed: false,
  event: {
    name: "Deposit",
    inputs: [
      {
        name: "user",
        type: "address" as InputType,
        value: "0x1e98677895078dd55bf59236B8bC477AB4e962c3",
      },
      {
        name: "lpToken",
        type: "address" as InputType,
        value: "0xA2fAA945acaDaed59797C40F906F9936906b9621",
      },
      {
        name: "amount",
        type: "uint256" as InputType,
        value: "99429785",
      },
    ],
  },
};

const Template = (args: Args) => ({
  components: { TransactionEventTableCell },
  setup() {
    return { args };
  },
  template: `<TransactionEventTableCell v-bind="args" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  item,
};

export const LastItem = Template.bind({}) as unknown as { args: Args };
LastItem.args = {
  item,
  popoverPlacement: "top",
};
