import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import RadioInput from "@/components/common/RadioInput.vue";

describe("RadioInput", () => {
  it("renders default slot", () => {
    const { container } = render(RadioInput, {
      slots: {
        default: {
          template: "Radio Input",
        },
      },
      props: {
        value: "radio",
      },
    });
    expect(container.textContent).toBe("Radio Input");
  });
  it("renders checked state correctly", async () => {
    const { container } = render(RadioInput, {
      props: {
        modelValue: "radio",
        value: "radio",
      },
    });
    expect(container.querySelector(".radio-input-container")!.classList.contains("checked")).toBe(true);
  });
  it("renders disabled state correctly", async () => {
    const { container } = render(RadioInput, {
      props: {
        modelValue: "radio",
        value: "radio",
        disabled: true,
      },
    });
    expect(container.querySelector(".radio-input-container")!.classList.contains("disabled")).toBe(true);
    expect(container.querySelector(".radio-input-container input")!.attributes.getNamedItem("disabled")).toBeTruthy();
  });
});
