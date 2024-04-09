import RadioInput from "./RadioInput.vue";

export default {
  title: "Common/RadioInput",
  component: RadioInput,
};

type Args = {
  value: string | number | boolean;
  modelValue: string | number | boolean;
  disabled?: boolean;
};

const Template = (args: Args) => ({
  components: { RadioInput },
  setup() {
    return { args };
  },
  template: `
    <RadioInput v-bind="args">Radio Input</RadioInput>`,
});

export const Checked = Template.bind({}) as unknown as { args: Args };
Checked.args = {
  value: "checked",
  modelValue: "checked",
};

export const Unchecked = Template.bind({}) as unknown as { args: Args };
Unchecked.args = {
  value: "",
  modelValue: "checked",
};

export const CheckedDisabled = Template.bind({}) as unknown as { args: Args };
CheckedDisabled.args = {
  value: "checked",
  modelValue: "checked",
  disabled: true,
};

export const UncheckedDisabled = Template.bind({}) as unknown as { args: Args };
UncheckedDisabled.args = {
  value: "",
  modelValue: "checked",
  disabled: true,
};
