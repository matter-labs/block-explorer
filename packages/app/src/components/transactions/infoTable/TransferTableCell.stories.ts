import TransferTableCell from "@/components/transactions/infoTable/TransferTableCell.vue";

import type { TokenTransfer } from "@/composables/useTransaction";

export default {
  title: "Transactions/TransferTableCell",
  component: TransferTableCell,
};

type Args = {
  transfer: TokenTransfer;
};

const Template = (args: Args) => ({
  components: { TransferTableCell },
  setup() {
    return { ...args };
  },
  template: `
    <TransferTableCell :transfer="transfer" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  transfer: {
    amount: "0x5f5e100",
    from: "0xf02b24b9a6ed5b6f5f332b723c679d5f73cb9262",
    to: "0xab611f2d2722bf09fc29dc786036502e100b4343",
    type: "transfer",
    fromNetwork: "L2",
    toNetwork: "L2",
    tokenInfo: {
      address: "0x54a14d7559baf2c8e8fa504e019d32479739018c",
      decimals: 6,
      l1Address: "0xd35cceead182dcee0f148ebac9447da2c4d449c4",
      l2Address: "0x54a14d7559baf2c8e8fa504e019d32479739018c",
      name: "USD Coin (goerli)",
      symbol: "USDC",
    },
  },
};
