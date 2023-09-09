import { describe, expect, it } from "vitest";

import { fireEvent } from "@testing-library/vue";
import { mount } from "@vue/test-utils";

import SolidityEditor from "@/components/SolidityEditor.vue";

describe("SolidityEditor", () => {
  it("renders component based on input values", () => {
    const wrapper = mount(SolidityEditor, {
      props: {
        modelValue: "",
      },
    });

    expect(wrapper.find("textarea")!.element.value).toEqual("");
  });

  it("renders initial value", async () => {
    const wrapper = mount(SolidityEditor, {
      props: {
        modelValue: "pragma solidity ^0.8.0;",
      },
    });

    expect(wrapper.find("textarea")!.element.value).toEqual("pragma solidity ^0.8.0;");
  });

  it("emits update:value when value updated", async () => {
    const wrapper = mount(SolidityEditor, {
      props: {
        modelValue: "",
      },
    });

    await fireEvent.update(wrapper.find("textarea")!.element, "pragma solidity ^0.8.0;");
    expect(wrapper.emitted()).toHaveProperty("update:modelValue", [["pragma solidity ^0.8.0;"]]);
  });

  it("value is updated on value property update", async () => {
    const wrapper = mount(SolidityEditor, {
      props: {
        modelValue: "",
      },
    });

    await wrapper.setProps({
      modelValue: "pragma solidity ^0.8.0;",
    });
    expect(wrapper.find("textarea")!.element.value).toEqual("pragma solidity ^0.8.0;");
  });

  it("adds disabled class when disabled is true", async () => {
    const wrapper = mount(SolidityEditor, {
      props: {
        modelValue: "",
        disabled: true,
      },
    });

    expect(wrapper.classes().includes("disabled")).toEqual(true);
  });

  it("adds read only class when read only is true", async () => {
    const wrapper = mount(SolidityEditor, {
      props: {
        modelValue: "",
        readOnly: true,
      },
    });

    expect(wrapper.classes().includes("read-only")).toEqual(true);
  });

  it("adds expanded class when expanded is true", async () => {
    const wrapper = mount(SolidityEditor, {
      props: {
        modelValue: "",
        expanded: true,
      },
    });

    expect(wrapper.classes().includes("expanded")).toEqual(true);
  });

  it("adds error class when error has value", async () => {
    const wrapper = mount(SolidityEditor, {
      props: {
        modelValue: "",
        error: "Some error",
      },
    });

    expect(wrapper.classes().includes("error")).toEqual(true);
  });
});
