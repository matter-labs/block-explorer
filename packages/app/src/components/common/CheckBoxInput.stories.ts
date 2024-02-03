import CheckBoxInput from "./CheckBoxInput.vue";

export default {
  title: "Common/CheckBoxInput",
  component: CheckBoxInput,
};

type Args = {
  value: boolean;
  modelValue: boolean;
};

const Template = (args: Args) => ({
  components: { CheckBoxInput },
  setup() {
    return { args };
  },
  template: `
    <CheckBoxInput v-bind="args">CheckBox Input</CheckBoxInput>`,
});

export const Checked = Template.bind({}) as unknown as { args: Args };
Checked.args = {
  value: true,
  modelValue: true,
};

export const Unchecked = Template.bind({}) as unknown as { args: Args };
Unchecked.args = {
  value: false,
  modelValue: false,
};
