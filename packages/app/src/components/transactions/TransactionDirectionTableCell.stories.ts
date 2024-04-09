import TransactionDirectionTableCell, {
  type Direction,
} from "@/components/transactions/TransactionDirectionTableCell.vue";

export default {
  title: "Transactions/TransactionDirectionTableCell",
  component: TransactionDirectionTableCell,
};

type Args = {
  text: Direction;
};

const Template = (args: Args) => ({
  components: { TransactionDirectionTableCell },
  setup() {
    return { ...args };
  },
  template: `
    <TransactionDirectionTableCell :text="text" />
  `,
});

export const InLabel = Template.bind({}) as unknown as { args: Args };
InLabel.args = {
  text: "in",
};

export const OutLabel = Template.bind({}) as unknown as { args: Args };
OutLabel.args = {
  text: "out",
};

export const SelfLabel = Template.bind({}) as unknown as { args: Args };
SelfLabel.args = {
  text: "self",
};
