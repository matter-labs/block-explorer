import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";
import { mount } from "@vue/test-utils";

import SearchField from "@/components/common/SearchField.vue";

import enUS from "@/locales/en.json";

describe("Search Field:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("sets the value", async () => {
    const wrapper = mount(SearchField, {
      props: {
        value: "",
      },
      global: {
        plugins: [i18n],
      },
    });
    const input = wrapper.find("input");
    await input.setValue("test");
    expect(input.element.value).toBe("test");
  });
  it("emits update:value when value changed", async () => {
    const wrapper = mount(SearchField, {
      props: {
        value: "",
      },
      global: {
        plugins: [i18n],
      },
    });
    wrapper.vm.$emit("update:value", "value");
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("update:value")).toBeTruthy();
    expect(wrapper.emitted("update:value")).toEqual([["value"]]);
  });
  it("shows input label if it exists", () => {
    const wrapper = mount(SearchField, {
      props: {
        value: "",
        label: "label",
      },
      global: {
        plugins: [i18n],
      },
    });
    const label = wrapper.find(".input-label");
    expect(label.element.textContent).toBe("label");
  });
  it("disables input when disabled is true", () => {
    const wrapper = mount(SearchField, {
      props: {
        value: "",
        disabled: true,
      },
      global: {
        plugins: [i18n],
      },
    });
    const input = wrapper.find("input");
    expect(input.attributes("disabled")).toBeDefined();
  });
  it("sets error text", () => {
    const wrapper = mount(SearchField, {
      props: {
        value: "",
        error: "error",
      },
      global: {
        plugins: [i18n],
      },
    });
    const error = wrapper.find("input");
    expect(error.classes()).toContain("has-error");
    expect(wrapper.find(".error-message").text()).toBe("Please, enter a correct query");
  });
  it("sets spinner if pending is true", () => {
    const { container } = render(SearchField, {
      props: {
        value: "",
        pending: true,
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelector(".spinner-container")).not.toBeNull();
  });
  it("emits update:value with trimmed value", async () => {
    const wrapper = mount(SearchField, {
      props: {
        value: "",
      },
      global: {
        plugins: [i18n],
      },
    });
    const input = wrapper.find("input");
    await input.setValue("  test ");
    expect(wrapper.emitted("update:value")).toEqual([["test"]]);
  });
});
