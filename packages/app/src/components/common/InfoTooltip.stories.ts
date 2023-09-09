import InfoTooltip from "./InfoTooltip.vue";

export default {
  title: "Common/InfoTooltip",
  component: InfoTooltip,
};

type Args = {
  defaultSlot: string;
};

const Template = (args: Args) => ({
  components: { InfoTooltip },
  setup() {
    return { ...args };
  },
  template: `
    <InfoTooltip>{{ defaultSlot }}</InfoTooltip>
  `,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  defaultSlot: "Tooltip text",
};
