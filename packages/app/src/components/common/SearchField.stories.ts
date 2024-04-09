import SearchField from "./SearchField.vue";

export default {
  title: "Common/SearchField",
  component: SearchField,
};

type Args = {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  pending: boolean;
  error: string;
};

const Template = (args: Args) => ({
  components: { SearchField },
  setup() {
    return { args };
  },
  template: `<search-field v-bind="args" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  label: "",
  value: "",
  placeholder: "Search by batch number, tx hash, state root hash, account address",
  disabled: false,
  pending: false,
  error: "",
};

export const WithLabel = Template.bind({}) as unknown as { args: Args };
WithLabel.args = {
  label: "Label",
  value: "",
  placeholder: "Search by batch number, tx hash, state root hash, account address",
  disabled: false,
  pending: false,
  error: "",
};
