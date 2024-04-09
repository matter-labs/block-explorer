import InfoTooltipWithContent from "./InfoTooltipWithContent.vue";

export default {
  title: "Common/InfoTooltipWithContent",
  component: InfoTooltipWithContent,
};

type Args = {
  defaultSlot: string;
};

const Template = (args: Args) => ({
  components: { InfoTooltipWithContent },
  setup() {
    return { ...args };
  },
  template: `
    <InfoTooltipWithContent>{{ defaultSlot }}</InfoTooltipWithContent>
  `,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  defaultSlot: "Some text",
};
