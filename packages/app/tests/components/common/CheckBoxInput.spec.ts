import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import CheckBoxInput from "@/components/common/CheckBoxInput.vue";

describe("CheckBoxInput", () => {
  it("renders default slot", () => {
    const { container } = render(CheckBoxInput, {
      slots: {
        default: {
          template: "CheckBox Input",
        },
      },
      props: {
        modelValue: true,
      },
    });
    expect(container.textContent).toBe("CheckBox Input");
  });
  it("renders checked state correctly", async () => {
    const { container } = render(CheckBoxInput, {
      props: {
        modelValue: true,
      },
    });
    expect(container.querySelector(".checkbox-input-container")!.classList.contains("checked")).toBe(true);
    expect(container.querySelector<HTMLInputElement>(".checkbox-input-container input")?.checked).toBe(true);
  });
  it("renders unchecked state correctly", async () => {
    const { container } = render(CheckBoxInput, {
      props: {
        modelValue: false,
      },
    });
    expect(container.querySelector(".checkbox-input-container")!.classList.contains("checked")).toBe(false);
    expect(container.querySelector<HTMLInputElement>(".checkbox-input-container input")?.checked).toBe(false);
  });
});
