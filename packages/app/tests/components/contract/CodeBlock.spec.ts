import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import SolidityEditor from "@/components/SolidityEditor.vue";
import CopyButton from "@/components/common/CopyButton.vue";
import CodeBlock from "@/components/contract/CodeBlock.vue";

describe("CodeBlock", () => {
  it("renders data from props", () => {
    const wrapper = mount(CodeBlock, {
      global: {
        stubs: ["CopyButton"],
      },
      props: {
        label: "Test label",
        code: "some code",
      },
    });
    expect(wrapper.find(".code-block-label").text()).toBe("Test label");
    expect(wrapper.findComponent(SolidityEditor).props().modelValue).toBe("some code");
    expect(wrapper.findComponent(CopyButton).props().value).toBe("some code");
  });
  it("toggles expanded mode when expand button is clicked", async () => {
    const wrapper = mount(CodeBlock, {
      global: {
        stubs: ["CopyButton"],
      },
      props: {
        label: "Test label",
        code: "some code",
      },
    });
    expect(wrapper.findComponent(SolidityEditor).props().expanded).toBe(false);
    await wrapper.find(".expand-button").trigger("click");
    expect(wrapper.findComponent(SolidityEditor).props().expanded).toBe(true);
  });
});
