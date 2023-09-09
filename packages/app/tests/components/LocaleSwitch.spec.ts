import { describe, expect, it } from "vitest";

import { fireEvent, render } from "@testing-library/vue";

import LocaleSwitch from "@/components/LocaleSwitch.vue";

describe("LocaleSwitch:", () => {
  it("renders listbox button with selected option", async () => {
    const { getByText } = render(LocaleSwitch, {
      props: {
        value: "uk",
        options: [
          { value: "en", label: "English", imageUrl: "en.svg" },
          { value: "uk", label: "Ukrainian", imageUrl: "uk.svg" },
        ],
      },
    });

    expect(getByText("Ukrainian"));
  });

  it("renders list of locales when button is clicked", async () => {
    const { container, getByText } = render(LocaleSwitch, {
      props: {
        value: "en",
        options: [
          { value: "en", label: "English", imageUrl: "" },
          { value: "uk", label: "Ukrainian", imageUrl: "" },
        ],
      },
    });

    await fireEvent.click(container.querySelector(".toggle-button")!);

    expect(getByText("Ukrainian", { selector: ".language-list-item-label" }));
    expect(getByText("English", { selector: ".language-list-item-label" }));
  });

  it("emits update:value when click on locale", async () => {
    const { container, emitted } = render(LocaleSwitch, {
      props: {
        value: "en",
        options: [
          { value: "en", label: "English", imageUrl: "" },
          { value: "uk", label: "Ukrainian", imageUrl: "" },
        ],
      },
    });

    await fireEvent.click(container.querySelector(".toggle-button")!);
    await fireEvent.click(container.querySelector(".language-list-item:last-child")!);

    expect(emitted()).toHaveProperty("update:value", [["uk"]]);
  });
});
