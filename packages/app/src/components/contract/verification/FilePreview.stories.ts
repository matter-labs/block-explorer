import FilePreview from "./FilePreview.vue";

export default {
  title: "Contract/Verification/FilePreview",
  component: FilePreview,
};

type Args = {
  name: string;
  size: number;
  index: number;
};

const Template = (args: Args) => ({
  components: { FilePreview },
  setup() {
    return { args };
  },
  template: `<FilePreview v-bind="args" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };

Default.args = {
  name: "ERC20.sol",
  size: 12845,
  index: 0,
};
