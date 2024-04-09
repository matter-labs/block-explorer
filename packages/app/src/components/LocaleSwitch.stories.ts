import LocaleSwitch from "./LocaleSwitch.vue";

export default {
  title: "components/LocaleSwitch",
  component: LocaleSwitch,
};

type Locale = {
  value: string;
  label: string;
};

type Args = {
  value: string;
  options: Locale[];
};

const Template = (args: Args) => ({
  components: { LocaleSwitch },
  setup() {
    return { ...args };
  },
  template: `<LocaleSwitch class="w-36" :options="options" :value="value" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  value: "en",
  options: [
    {
      value: "en",
      label: "English",
    },
    {
      value: "uk",
      label: "Ukrainian",
    },
  ],
};
