import CodeBlock from "./CodeBlock.vue";

export default {
  title: "Contract/CodeBlock",
  component: CodeBlock,
};

type Args = {
  label: string;
  code: string;
};

const Template = (args: Args) => ({
  components: { CodeBlock },
  setup() {
    return { args };
  },
  template: `<CodeBlock v-bind="args" />`,
});

const code = `// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20{
  constructor(string memory name, string memory symbol, uint256 cap) ERC20(name, symbol) {
    _mint(msg.sender,cap);
  }
}`;

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  label: "File 1 of 4 : Proxy.sol",
  code,
};
