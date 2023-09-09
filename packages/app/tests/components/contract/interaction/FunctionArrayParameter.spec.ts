import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import Input from "@/components/common/Input.vue";
import FunctionArrayParameter from "@/components/contract/interaction/FunctionArrayParameter.vue";

describe("FunctionArrayParameter:", () => {
  it("renders label and type", () => {
    const wrapper = mount(FunctionArrayParameter, {
      props: {
        label: "addrs",
        type: "address[]",
        modelValue: [""],
      },
    });

    expect(wrapper.find(".function-input-label").text()).toEqual("addrs (address[])");
  });

  it("renders placeholder text", () => {
    const wrapper = mount(FunctionArrayParameter, {
      props: {
        label: "addrs",
        type: "address[]",
        modelValue: ["value1", "value2"],
      },
    });

    expect(wrapper.findAll("input")[0].attributes("placeholder")).toBe("addrs[0] (address)");
    expect(wrapper.findAll("input")[1].attributes("placeholder")).toBe("addrs[1] (address)");
  });

  it("renders input errors from errors array", () => {
    const wrapper = mount(FunctionArrayParameter, {
      stubs: {
        Input,
      },
      props: {
        label: "addrs",
        type: "address[]",
        modelValue: ["value1", "value2"],
        errors: ["error 1", undefined],
      },
    });

    expect(wrapper.findComponent(Input).props().error).toBe("error 1");
  });

  it("adds new input if there are currently no inputs", async () => {
    const wrapper = mount(FunctionArrayParameter, {
      props: {
        label: "addrs",
        type: "address[]",
        modelValue: [],
      },
    });

    expect(wrapper.emitted("update:modelValue")).toEqual([[[""]]]);
  });

  it("adds new input on add button click", async () => {
    const wrapper = mount(FunctionArrayParameter, {
      props: {
        label: "addrs",
        type: "address[]",
        modelValue: ["value1"],
      },
    });

    await wrapper.find(".function-add-button").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[["value1", ""]]]);
  });

  it("doesn't show add and trash button when array has fixed length", async () => {
    const wrapper = mount(FunctionArrayParameter, {
      props: {
        label: "addrs",
        type: "address[1]",
        modelValue: ["value1"],
      },
    });

    expect(wrapper.find(".function-add-button").exists()).toBeFalsy();
    expect(wrapper.find(".function-parameter-trash-button").exists()).toBeFalsy();
  });
});
