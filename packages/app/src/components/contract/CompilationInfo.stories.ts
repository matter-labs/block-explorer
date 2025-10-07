import CompilationInfo from "./CompilationInfo.vue";

import type { Contract } from "@/composables/useAddress";

export default {
  title: "Contract/CompilationInfo",
  component: CompilationInfo,
};

type Args = {
  contract: Contract;
};

const Template = (args: Args) => ({
  components: { CompilationInfo },
  setup() {
    return { args };
  },
  template: `<CompilationInfo v-bind="args" />`,
});

const contract: Contract = {
  verificationInfo: {
    compilation: {
      compilerVersion: "0.8.17",
      fullyQualifiedName: "SwapRouter.sol:SwapRouter",
      compilerSettings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
} as Contract;

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  contract,
};
