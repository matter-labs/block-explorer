import { describe, expect, it } from "vitest";

import { fireEvent, render } from "@testing-library/vue";

import Dropdown from "@/components/common/Dropdown.vue";

describe("Dropdown:", () => {
  it("renders component properly", () => {
    const { container } = render(Dropdown, {
      props: {
        modelValue: "v1.1.6",
        error: "",
        defaultOption: "v1.1.6",
        pending: false,
        options: ["v1.1.6", "v1.1.5", "v1.1.4"],
      },
    });
    expect(container.querySelector(".toggle-button")?.textContent).toBe("v1.1.6");
  });
  it("shows loader when 'pending' is equal to 'true'", () => {
    const { container } = render(Dropdown, {
      props: {
        modelValue: "v1.1.6",
        error: "",
        defaultOption: "v1.1.6",
        pending: true,
        options: ["v1.1.6", "v1.1.5", "v1.1.4"],
      },
    });
    expect(container.querySelector(".button-spinner")).toBeDefined();
  });
  it("shows error message when 'error' is not empty", () => {
    const { container } = render(Dropdown, {
      props: {
        modelValue: "v1.1.6",
        error: "Unable to get list of supported Compiler versions",
        defaultOption: "v1.1.6",
        pending: false,
        options: ["v1.1.6", "v1.1.5", "v1.1.4"],
      },
    });
    expect(container.querySelector("p")?.textContent).toBe("Unable to get list of supported Compiler versions");
  });
  it("renders all select options in the dropdown", async () => {
    const { container } = render(Dropdown, {
      props: {
        modelValue: "v1.1.6",
        options: ["v1.1.6", "v1.1.5", "v1.1.4"],
      },
    });
    const button = container.querySelector(".toggle-button");
    await fireEvent.click(button!);
    const li = container.querySelectorAll(".options-list-item");
    expect(Array.from(li).map((e) => e.textContent?.trim())).toEqual(["v1.1.6", "v1.1.5", "v1.1.4"]);
  });
  it("uses formatter for displayed value and dropdown values", async () => {
    const { container } = render(Dropdown, {
      props: {
        modelValue: "1.1.6",
        options: ["1.1.6", "1.1.5", "1.1.4"],
        formatter: (value: unknown) => `v${value}`,
      },
    });
    const button = container.querySelector(".toggle-button");
    expect(button?.textContent).toBe("v1.1.6");
    await fireEvent.click(button!);
    const li = container.querySelectorAll(".options-list-item");
    expect(Array.from(li).map((e) => e.textContent?.trim())).toEqual(["v1.1.6", "v1.1.5", "v1.1.4"]);
  });
  it("emits update:modelValue when selectedVersion dropdown value changed", async () => {
    const { container, emitted } = render(Dropdown, {
      props: {
        modelValue: "v1.1.6",
        error: "",
        defaultOption: "v1.1.6",
        pending: true,
        options: ["v1.1.6", "v1.1.5", "v1.1.4"],
      },
    });
    const button = container.querySelector(".toggle-button");
    await fireEvent.click(button!);
    const li = container.querySelectorAll(".options-list-item");
    await fireEvent.click(li[0]!);
    expect(emitted()).toHaveProperty("update:modelValue", [["v1.1.6"]]);
  });
});
