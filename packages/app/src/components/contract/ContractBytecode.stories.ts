import ContractBytecode from "./ContractBytecode.vue";

import type { Contract } from "@/composables/useAddress";

export default {
  title: "Contract/ContractBytecode",
  component: ContractBytecode,
};

type Args = {
  contract: Contract;
};

const Template = (args: Args) => ({
  components: { ContractBytecode },
  setup() {
    return { args };
  },
  template: `<ContractBytecode v-bind="args" />`,
});

const contract: Contract = {
  type: "contract",
  address: "0x9c85ac2d94a722e56027db3db728005b29059fc9",
  blockNumber: 123,
  bytecode: "0x606060405236156100255763ffffffff60e060020a600035041663a500849e81146100a7575b6100a55b6",
  creatorAddress: "0xa76640095ce5f618eeb71d6692e17b4a1a92dbb6",
  creatorTxHash: "0xcdab4a39d32a15bafb0b992da1dff8a4b782be450be63c8a64c955758370574f",
  createdInBlockNumber: 142622,
  isEvmLike: false,
  verificationInfo: {
    abi: [
      {
        inputs: [],
        name: "get",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "x",
            type: "uint256",
          },
        ],
        name: "increment",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    compilation: {
      language: "Solidity",
      compilerVersion: "0.8.17",
      fullyQualifiedName: "Counter.sol:Counter",
      compilerSettings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
    sources: {
      "Counter.sol:Counter": {
        content:
          "// SPDX-License-Identifier: UNLICENSED\n\npragma solidity ^0.8.0;\n\ncontract Counter {\n    uint256 value;\n\n    function increment(uint256 x) public {\n        value += x;\n    }\n\n    function get() public view returns (uint256) {\n        return value;\n    }\n}\n",
      },
    },
    verifiedAt: "2022-06-13T14:15:24.492984Z",
    match: "exact_match",
  },
  balances: {},
  totalTransactions: 0,
  proxyInfo: null,
} as Contract;

export const Verified = Template.bind({}) as unknown as { args: Args };
Verified.args = {
  contract,
};

export const NotVerified = Template.bind({}) as unknown as { args: Args };
NotVerified.args = {
  contract: {
    ...contract,
    verificationInfo: null,
  },
};
