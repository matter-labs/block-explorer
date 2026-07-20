import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import FormItem from "@/components/form/FormItem.vue";

describe("FormItem", () => {
  it("renders default slot", () => {
    const wrapper = mount(FormItem, {
      slots: {
        default: {
          template: "FormItem",
        },
        underline: "",
      },
    });
    expect(wrapper.text()).toBe("FormItem");
  });
  it("uses custom tag if tag property was passed", async () => {
    const wrapper = mount(FormItem, {
      props: {
        tag: "fieldset",
      },
    });
    expect(wrapper.element.tagName).toBe("FIELDSET");
  });
  it("does not render label if it wasn't defined", async () => {
    const wrapper = mount(FormItem);
    expect(wrapper.find(".form-item-label").exists()).toBe(false);
  });
  it("renders label if label prop was passed", async () => {
    const wrapper = mount(FormItem, {
      props: {
        label: "Label text",
      },
    });
    expect(wrapper.find("label.form-item-label").text()).toBe("Label text");
  });
  it("renders custom label tag if label tag prop was passed", async () => {
    const wrapper = mount(FormItem, {
      props: {
        label: "Label text",
        labelTag: "legend",
      },
    });
    expect(wrapper.find("legend.form-item-label").text()).toBe("Label text");
  });
  it("renders for attribute if id prop was passed", async () => {
    const wrapper = mount(FormItem, {
      props: {
        label: "Label text",
        id: "label123",
      },
    });
    expect(wrapper.find("label.form-item-label").attributes().for).toBe("label123");
  });
  it("does not render underline if underline prop wasn't passed", async () => {
    const wrapper = mount(FormItem);
    expect(wrapper.find(".form-item-underline").exists()).toBe(false);
  });
  it("renders underline if underline prop was passed", async () => {
    const wrapper = mount(FormItem, {
      slots: {
        default: "",
        underline: "Underline text",
      },
    });
    expect(wrapper.find(".form-item-underline").text()).toBe("Underline text");
  });
});
