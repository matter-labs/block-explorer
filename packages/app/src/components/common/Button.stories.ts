import Button from "./Button.vue";

export default {
  title: "Common/Button",
  component: Button,
};

type Args = {
  color: "primary" | "secondary";
  size: "md" | "lg";
  variant: "contained" | "outlined";
  disabled?: boolean;
  loading?: boolean;
};

const Template = (args: Args) => ({
  components: { Button },
  setup() {
    return { args };
  },
  template: `
    <Button v-bind="args">Button</Button>`,
});

export const PrimaryLoading = Template.bind({}) as unknown as { args: Args };
PrimaryLoading.args = {
  color: "primary",
  size: "md",
  variant: "contained",
  loading: true,
};
export const PrimaryDisabled = Template.bind({}) as unknown as { args: Args };
PrimaryDisabled.args = {
  color: "primary",
  size: "md",
  variant: "contained",
  disabled: true,
};
export const PrimaryDisabledLoading = Template.bind({}) as unknown as { args: Args };
PrimaryDisabledLoading.args = {
  color: "primary",
  size: "md",
  variant: "contained",
  disabled: true,
  loading: true,
};
export const PrimaryMdContained = Template.bind({}) as unknown as { args: Args };
PrimaryMdContained.args = {
  color: "primary",
  size: "md",
  variant: "contained",
};
export const PrimaryMdOutlined = Template.bind({}) as unknown as { args: Args };
PrimaryMdOutlined.args = {
  color: "primary",
  size: "md",
  variant: "outlined",
};
export const PrimaryLgContained = Template.bind({}) as unknown as { args: Args };
PrimaryLgContained.args = {
  color: "primary",
  size: "lg",
  variant: "contained",
};
export const PrimaryLgOutlined = Template.bind({}) as unknown as { args: Args };
PrimaryLgOutlined.args = {
  color: "primary",
  size: "lg",
  variant: "outlined",
};

export const SecondaryLoading = Template.bind({}) as unknown as { args: Args };
SecondaryLoading.args = {
  color: "secondary",
  size: "md",
  variant: "contained",
  loading: true,
};
export const SecondaryDisabled = Template.bind({}) as unknown as { args: Args };
SecondaryDisabled.args = {
  color: "secondary",
  size: "md",
  variant: "contained",
  disabled: true,
};
export const SecondaryDisabledLoading = Template.bind({}) as unknown as { args: Args };
SecondaryDisabledLoading.args = {
  color: "secondary",
  size: "md",
  variant: "contained",
  disabled: true,
  loading: true,
};
export const SecondaryMdContained = Template.bind({}) as unknown as { args: Args };
SecondaryMdContained.args = {
  color: "secondary",
  size: "md",
  variant: "contained",
};
export const SecondaryMdOutlined = Template.bind({}) as unknown as { args: Args };
SecondaryMdOutlined.args = {
  color: "secondary",
  size: "md",
  variant: "outlined",
};
export const SecondaryLgContained = Template.bind({}) as unknown as { args: Args };
SecondaryLgContained.args = {
  color: "secondary",
  size: "lg",
  variant: "contained",
};
export const SecondaryLgOutlined = Template.bind({}) as unknown as { args: Args };
SecondaryLgOutlined.args = {
  color: "secondary",
  size: "lg",
  variant: "outlined",
};
