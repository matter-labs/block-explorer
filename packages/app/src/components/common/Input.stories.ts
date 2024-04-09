import Input from "./Input.vue";

export default {
  title: "Common/Input",
  component: Input,
};

type Args = {
  modelValue: string | number;
  error?: string;
  disabled?: boolean;
};

const Template = (args: Args) => ({
  components: { Input },
  setup() {
    return { args };
  },
  data() {
    return {
      value: args.modelValue,
    };
  },
  template: `
    <Input v-bind="args" v-model="value">Radio Input</Input>`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  modelValue: "",
};

export const Disabled = Template.bind({}) as unknown as { args: Args };
Disabled.args = {
  modelValue: "",
  disabled: true,
};

export const WithValue = Template.bind({}) as unknown as { args: Args };
WithValue.args = {
  modelValue: "Input value",
};

export const DisabledWithValue = Template.bind({}) as unknown as { args: Args };
DisabledWithValue.args = {
  modelValue: "Input value",
  disabled: true,
};

export const WithError = Template.bind({}) as unknown as { args: Args };
WithError.args = {
  modelValue: "",
  error: "It's an error",
};
