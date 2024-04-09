import Dropdown from "./Dropdown.vue";

export default {
  title: "Common/Dropdown",
  component: Dropdown,
};

type Args = {
  modelValue: string;
  id: string;
  pending: boolean;
  defaultOption: string;
  options: string[];
  error: string;
};

const Template = (args: Args) => ({
  components: { Dropdown },
  setup() {
    return { args };
  },
  data() {
    return {
      value: args.modelValue,
    };
  },
  template: `
    <Dropdown v-bind="args" v-model="value" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  modelValue: "",
  id: "1",
  pending: false,
  defaultOption: "v1.1.6",
  options: ["v1.1.6", "v1.1.5", "v1.1.4"],
  error: "",
};

export const Error = Template.bind({}) as unknown as { args: Args };
Error.args = {
  modelValue: "",
  id: "1",
  pending: false,
  defaultOption: "",
  options: [],
  error: "An error occurred",
};
