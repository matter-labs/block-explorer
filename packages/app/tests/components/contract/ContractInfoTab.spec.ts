import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import Alert from "@/components/common/Alert.vue";
import ContractInfoTab from "@/components/contract/ContractInfoTab.vue";

import enUS from "@/locales/en.json";

import type { Contract, ContractVerificationInfo } from "@/composables/useAddress";

import $testId from "@/plugins/testId";

const contract: Contract = {
  type: "contract",
  address: "0x9c85ac2d94a722e56027db3db728005b29059fc9",
  blockNumber: 10,
  balances: {},
  bytecode: "0x606060405236156100255763ffffffff60e060020a600035041663a500849e81146100a7575b6100a55b6",
  creatorAddress: "0xa76640095ce5f618eeb71d6692e17b4a1a92dbb6",
  creatorTxHash: "0xcdab4a39d32a15bafb0b992da1dff8a4b782be450be63c8a64c955758370574f",
  createdInBlockNumber: 142622,
  totalTransactions: 0,
  verificationInfo: {
    artifacts: {
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
      bytecode: [
        0, 0, 0, 46, 4, 0, 0, 65, 0, 0, 0, 0, 1, 65, 1, 111, 0, 0, 0, 47, 4, 0, 0, 65, 0, 0, 0, 0, 0, 20, 3, 118, 0, 0,
        0, 48, 1, 0, 0, 65, 0, 0, 0, 0, 0, 33, 3, 118, 0, 0, 0, 1, 1, 48, 1, 143, 0, 0, 0, 0, 1, 1, 0, 75, 0, 0, 0, 17,
      ],
    },
    request: {
      compilerSolcVersion: "v1.1.0",
      constructorArguments: "0x",
      contractAddress: "0x9c85ac2d94a722e56027db3db728005b29059fc9",
      contractName: "Counter",
      id: 10,
      optimizationUsed: true,
      sourceCode:
        "// SPDX-License-Identifier: UNLICENSED\n\npragma solidity ^0.8.0;\n\ncontract Counter {\n    uint256 value;\n\n    function increment(uint256 x) public {\n        value += x;\n    }\n\n    function get() public view returns (uint256) {\n        return value;\n    }\n}\n",
    },
    verifiedAt: "2022-06-13T14:15:24.492984Z",
  } as ContractVerificationInfo,
} as Contract;

vi.mock("vue-router");

describe("Contract Info Tab", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders tabs based on input", () => {
    const wrapper = mount(ContractInfoTab, {
      props: {
        contract: contract,
      },
      global: {
        plugins: [i18n, $testId],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    expect(wrapper.findAll(".tab-head li").length).toBe(3);
    expect(wrapper.findAll(".function-type-title")[0].text()).toBe("Read");
    expect(wrapper.findAll(".function-disclosure-btn")[0].text()).toBe("1. get");
    expect(wrapper.findAll(".function-type-title")[1].text()).toBe("Write");
    expect(wrapper.findAll(".function-disclosure-btn")[1].text()).toBe("1. increment");
  });

  it("does not render tabs component", () => {
    const wrapper = mount(ContractInfoTab, {
      props: {
        contract: {
          ...contract,
          verificationInfo: null,
        },
      },
      global: {
        plugins: [i18n, $testId],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    expect(wrapper.findAll(".tab-head li").length).toBe(0);
    const routerArray = wrapper.find(".contract-link-container").findAllComponents(RouterLinkStub);
    expect(routerArray[0].props().to.name).toBe("contract-verification");
    expect(routerArray[0].props().to.query.address).toBe(contract.address);
  });

  describe("Proxy contract", () => {
    describe("when implementation contract is not verified", () => {
      it("renders proxy tabs and contract not verified warning", () => {
        const wrapper = mount(ContractInfoTab, {
          props: {
            contract: {
              ...contract,
              proxyInfo: {
                implementation: {
                  address: "0x9c85ac2d94a722e56027db3db728005b29059fc8",
                  verificationInfo: null,
                },
              },
            },
          },
          global: {
            plugins: [i18n, $testId],
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        expect(wrapper.findAll(".tab-head li").length).toBe(5);
        expect(wrapper.findAll(".function-type-title")[0].text()).toBe("Read");
        expect(wrapper.findAll(".function-disclosure-btn")[0].text()).toBe("1. get");
        expect(wrapper.findAll(".function-type-title")[1].text()).toBe("Write");
        expect(wrapper.findAll(".function-disclosure-btn")[1].text()).toBe("1. increment");
        expect(wrapper.findAll(".tab-head li .tab-btn")[3].text()).toBe("Read as Proxy");
        expect(wrapper.findAll(".proxy-implementation-link")[0].findComponent(Alert).props().type).toBe("warning");
        expect(wrapper.findAll(".tab-head li .tab-btn")[4].text()).toBe("Write as Proxy");
        expect(wrapper.findAll(".proxy-implementation-link")[1].findComponent(Alert).props().type).toBe("warning");
      });
    });

    describe("when implementation contract is verified", () => {
      it("renders proxy tabs and read/write as proxy functions", () => {
        const wrapper = mount(ContractInfoTab, {
          props: {
            contract: {
              ...contract,
              proxyInfo: {
                implementation: {
                  address: "0x9c85ac2d94a722e56027db3db728005b29059fc8",
                  verificationInfo: {
                    artifacts: {
                      abi: [
                        {
                          inputs: [],
                          name: "get2",
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
                          name: "increment2",
                          outputs: [],
                          stateMutability: "nonpayable",
                          type: "function",
                        },
                      ],
                    },
                  } as unknown as ContractVerificationInfo,
                },
              },
            },
          },
          global: {
            plugins: [i18n, $testId],
            stubs: {
              RouterLink: RouterLinkStub,
            },
          },
        });

        expect(wrapper.findAll(".tab-head li").length).toBe(5);
        expect(wrapper.findAll(".function-type-title")[0].text()).toBe("Read");
        expect(wrapper.findAll(".function-disclosure-btn")[0].text()).toBe("1. get");
        expect(wrapper.findAll(".function-type-title")[1].text()).toBe("Write");
        expect(wrapper.findAll(".function-disclosure-btn")[1].text()).toBe("1. increment");
        expect(wrapper.findAll(".tab-head li .tab-btn")[3].text()).toBe("Read as Proxy");
        expect(wrapper.findAll(".proxy-implementation-link")[0].findComponent(Alert).props().type).toBe("notification");
        expect(wrapper.findAll(".function-disclosure-btn")[2].text()).toBe("1. get2");
        expect(wrapper.findAll(".proxy-implementation-link")[1].findComponent(Alert).props().type).toBe("notification");
        expect(wrapper.findAll(".tab-head li .tab-btn")[4].text()).toBe("Write as Proxy");
        expect(wrapper.findAll(".function-disclosure-btn")[3].text()).toBe("1. increment2");
      });
    });
  });
});
