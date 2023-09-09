import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { flushPromises, mount } from "@vue/test-utils";

import Input from "@/components/common/Input.vue";
import FunctionArrayParameter from "@/components/contract/interaction/FunctionArrayParameter.vue";
import FunctionForm from "@/components/contract/interaction/FunctionForm.vue";

import enUS from "@/locales/en.json";

import type { AbiFragment } from "@/composables/useAddress";

const abiFragment: AbiFragment = {
  inputs: [
    { internalType: "address[]", name: "spender", type: "address[]" },
    { internalType: "uint256", name: "val", type: "uint256" },
    { internalType: "bool", name: "flag", type: "bool" },
  ],
  name: "decreaseAllowance",
  outputs: [{ internalType: "bool", name: "", type: "bool" }],
  stateMutability: "nonpayable",
  type: "function",
};

describe("FunctionForm:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  const global = {
    plugins: [i18n],
  };

  it("renders default slot", () => {
    const wrapper = mount(FunctionForm, {
      global,
      props: {
        type: "write",
        abiFragment,
      },
      slots: {
        default: "Test",
      },
    });

    expect(wrapper.text()).toContain("Test");
  });
  it("renders form fields based on input", async () => {
    const wrapper = mount(FunctionForm, {
      global,
      stubs: {
        Input,
        FunctionArrayParameter,
      },
      props: {
        type: "write",
        abiFragment,
      },
    });

    const fields = wrapper.findAll(".disclosure-panel-input-container");
    expect(fields[0].findComponent(FunctionArrayParameter).props().label).toBe("spender");
    expect(fields[0].findComponent(FunctionArrayParameter).props().type).toBe("address[]");
    expect(fields[1].findComponent(Input).exists()).toBeTruthy();
    expect(fields[1].find("label").text()).toBe("val (uint256)");
    expect(fields[2].findComponent(Input).exists()).toBeTruthy();
    expect(fields[2].find("label").text()).toBe("flag (bool)");
  });
  it("renders payableAmount input field for payable method", async () => {
    const wrapper = mount(FunctionForm, {
      global,
      stubs: {
        Input,
        FunctionArrayParameter,
      },
      props: {
        type: "write",
        abiFragment: {
          ...abiFragment,
          stateMutability: "payable",
        },
      },
    });

    const fields = wrapper.findAll(".disclosure-panel-input-container");
    expect(fields[0].findComponent(Input).exists()).toBeTruthy();
    expect(fields[0].find("label").text()).toBe("payableAmount (ether)");
  });
  it("doesn't show error if last field is empty and the array unassigned", async () => {
    const wrapper = mount(FunctionForm, {
      global,
      stubs: {
        Input,
      },
      props: {
        type: "write",
        abiFragment: {
          ...abiFragment,
          inputs: [abiFragment.inputs[0]],
        },
      },
    });

    await wrapper.find("form").trigger("submit");
    const field = wrapper.findComponent(FunctionArrayParameter);
    expect(field.props().errors).toEqual([undefined]);
  });
  it("does show error if last field is empty and the array has fixed length", async () => {
    const wrapper = mount(FunctionForm, {
      global,
      stubs: {
        Input,
      },
      props: {
        type: "write",
        abiFragment: {
          ...abiFragment,
          inputs: [
            {
              ...abiFragment.inputs[0],
              type: "address[1]",
            },
          ],
        },
      },
    });

    await wrapper.find("form").trigger("submit");
    const field = wrapper.findComponent(FunctionArrayParameter);
    expect(field.props().errors).toEqual(["Value is required"]);
  });
  it("validates input and shows an error when value is invalid", async () => {
    const wrapper = mount(FunctionForm, {
      global,
      props: {
        type: "write",
        abiFragment: {
          ...abiFragment,
          stateMutability: "payable",
          inputs: [abiFragment.inputs[0]],
        },
      },
    });

    await wrapper.find("form").trigger("submit");

    const payableAmountInput = wrapper.findComponent(Input);
    await payableAmountInput.find("input").setValue("0x123");
    expect(payableAmountInput.props().error).toEqual("Value is invalid");
    await payableAmountInput.find("input").setValue("0.1");
    expect(payableAmountInput.props().error).toEqual(null);

    const arrayField = wrapper.findComponent(FunctionArrayParameter);
    await arrayField.find("input").setValue("0x123");
    expect(arrayField.props().errors).toEqual(["Value is invalid"]);
    await arrayField.find("input").setValue("0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044");
    expect(arrayField.props().errors).toEqual([undefined]);
  });
  it("converts boolean input values from string to bool before submission", async () => {
    const wrapper = mount(FunctionForm, {
      global,
      props: {
        type: "write",
        abiFragment: {
          inputs: [{ internalType: "bool", name: "flag", type: "bool" }],
          name: "testBool",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      },
    });

    const fields = wrapper.findAll(".disclosure-panel-input-container");
    const flagInput = fields[0].findComponent(Input);
    await flagInput.find("input").setValue("false");
    await wrapper.find("form").trigger("submit");

    await flushPromises();
    expect(wrapper.emitted("submit")).toEqual([[{ flag: false }]]);
  });
});
