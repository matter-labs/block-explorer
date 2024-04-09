import Alert from "./Alert.vue";

export default {
  title: "Common/Alert",
  component: Alert,
};

type Args = {
  type: string;
  slotText: string;
};

const Template = (args: Args) => ({
  components: { Alert },
  setup() {
    return { ...args };
  },
  template: `
    <Alert :type="type">{{ slotText }}</Alert>`,
});

export const WarningAlert = Template.bind({}) as unknown as { args: Args };
WarningAlert.args = {
  type: "warning",
  slotText: "Warning alert",
};

export const ErrorAlert = Template.bind({}) as unknown as { args: Args };
ErrorAlert.args = {
  type: "error",
  slotText: "Error alert",
};
