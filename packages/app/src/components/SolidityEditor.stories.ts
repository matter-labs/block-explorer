import SolidityEditor from "./SolidityEditor.vue";

export default {
  title: "components/SolidityEditor",
  component: SolidityEditor,
};

type Args = {
  modelValue: string | number;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

const Template = (args: Args) => ({
  components: { SolidityEditor },
  setup() {
    return { args };
  },
  data() {
    return {
      value: args.modelValue,
    };
  },
  template: `
    <SolidityEditor v-bind="args" v-model="value">Radio SolidityEditor</SolidityEditor>`,
});

const code = `// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract Counter {
    uint256 value;

    function increment(uint256 x) public {
        value += x;
    }

    function get() public view returns (uint256) {
        return value;
    }
}
`;

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  modelValue: "",
};

export const Disabled = Template.bind({}) as unknown as { args: Args };
Disabled.args = {
  modelValue: "",
  disabled: true,
};

export const ReadOnly = Template.bind({}) as unknown as { args: Args };
ReadOnly.args = {
  modelValue: "",
  readOnly: true,
};

export const WithValue = Template.bind({}) as unknown as { args: Args };
WithValue.args = {
  modelValue: code,
};

export const DisabledOnlyWithValue = Template.bind({}) as unknown as { args: Args };
DisabledOnlyWithValue.args = {
  modelValue: code,
  disabled: true,
};

export const ReadOnlyWithValue = Template.bind({}) as unknown as { args: Args };
ReadOnlyWithValue.args = {
  modelValue: code,
  readOnly: true,
};

export const Error = Template.bind({}) as unknown as { args: Args };
Error.args = {
  modelValue: "",
  error: "It's an error",
};

export const ErrorWithValue = Template.bind({}) as unknown as { args: Args };
ErrorWithValue.args = {
  modelValue: code,
  error: "It's an error",
};
