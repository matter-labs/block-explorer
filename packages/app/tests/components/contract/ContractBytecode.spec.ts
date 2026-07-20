import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import CodeBlock from "@/components/contract/CodeBlock.vue";
import ContractBytecode from "@/components/contract/ContractBytecode.vue";

import enUS from "@/locales/en.json";

import type { Contract } from "@/composables/useAddress";

import $testId from "@/plugins/testId";

const contract: Contract = {
  type: "contract",
  address: "0x9c85ac2d94a722e56027db3db728005b29059fc9",
  blockNumber: 100,
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
      compilerVersion: "0.8.20",
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
  totalTransactions: 0,
  balances: {},
  proxyInfo: null,
};

describe("ContractBytecode", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders component based on input values", () => {
    const wrapper = mount(ContractBytecode, {
      global: {
        plugins: [i18n, $testId],
        stubs: ["router-link"],
      },
      props: {
        contract,
      },
    });
    expect(wrapper.find(".bytecode").text()).toBe(
      "0x606060405236156100255763ffffffff60e060020a600035041663a500849e81146100a7575b6100a55b6"
    );
  });

  it("renders contract code when solidity single-file contract is verified", () => {
    const wrapper = mount(ContractBytecode, {
      global: {
        plugins: [i18n, $testId],
        stubs: ["router-link"],
      },
      props: {
        contract,
      },
    });
    const codeBlocks = wrapper.findAllComponents(CodeBlock);
    expect(codeBlocks.length).toBe(2);
    expect(codeBlocks[0].props().label).toBe("Single file contract");
    expect(codeBlocks[0].props().code).toBe(contract.verificationInfo?.sources["Counter.sol:Counter"].content);
  });

  it("renders contract abi json when solidity single-file contract is verified", () => {
    const wrapper = mount(ContractBytecode, {
      global: {
        plugins: [i18n, $testId],
        stubs: ["router-link"],
      },
      props: {
        contract,
      },
    });
    expect(wrapper.find(".abi-json").text()).toBe(JSON.stringify(contract.verificationInfo?.abi));
  });

  it("renders all contract files when contract is multi-file and verified", () => {
    const verifiedContractSources = {
      "@openzeppelin/contracts/token/ERC20/ERC20.sol": {
        content: "File Content1",
      },
      "@openzeppelin/contracts/token/ERC20/IERC20.sol": {
        content: "File Content 2",
      },
    };
    const wrapper = mount(ContractBytecode, {
      global: {
        plugins: [i18n, $testId],
        stubs: ["router-link"],
      },
      props: {
        contract: {
          ...contract,
          verificationInfo: {
            ...contract.verificationInfo,
            sources: verifiedContractSources,
          },
        } as Contract,
      },
    });
    const codeBlocks = wrapper.findAllComponents(CodeBlock);
    expect(codeBlocks.length).toBe(3);
    expect(codeBlocks[0].props().label).toBe("File 1 of 2: ERC20.sol");
    expect(codeBlocks[0].props().code).toBe(
      verifiedContractSources["@openzeppelin/contracts/token/ERC20/ERC20.sol"].content
    );
    expect(codeBlocks[1].props().label).toBe("File 2 of 2: IERC20.sol");
    expect(codeBlocks[1].props().code).toBe(
      verifiedContractSources["@openzeppelin/contracts/token/ERC20/IERC20.sol"].content
    );
    expect(codeBlocks[2].props().label).toBe("Settings");
    expect(codeBlocks[2].props().code).toBe(
      JSON.stringify(
        {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
        null,
        2
      )
    );
  });

  it("renders correct link to verification when contract isn't verified", () => {
    const wrapper = mount(ContractBytecode, {
      global: {
        plugins: [i18n, $testId],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: {
        contract: {
          ...contract,
          verificationInfo: null,
        },
      },
    });

    const routerArray = wrapper.find(".contract-link-container").findAllComponents(RouterLinkStub);
    expect(routerArray[0].props().to.name).toBe("contract-verification");
    expect(routerArray[0].props().to.query.address).toBe(contract.address);
    wrapper.unmount();
  });
});
