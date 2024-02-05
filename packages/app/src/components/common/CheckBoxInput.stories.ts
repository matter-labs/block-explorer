import CheckBoxInput from "./CheckBoxInput.vue";

export default {
  title: "Common/CheckBoxInput",
  component: CheckBoxInput,
};

type Args = {
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
  modelValue: true,
};

export const Unchecked = Template.bind({}) as unknown as { args: Args };
Unchecked.args = {
  modelValue: false,
};
