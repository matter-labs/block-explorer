import SuccessScreen from "./SuccessScreen.vue";

export default {
  title: "Contract/Verification/SuccessScreen",
  component: SuccessScreen,
};

type Args = {
  contractAddress: string;
};

const Template = (args: Args) => ({
  components: { SuccessScreen },
  setup() {
    return { args };
  },
  template: `<SuccessScreen v-bind="args" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };

Default.args = {
  contractAddress: "0x0150673c86121237ac004dbd3371c03f481e4dc3",
};
