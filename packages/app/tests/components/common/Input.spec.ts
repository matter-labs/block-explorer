import { describe, expect, it } from "vitest";

import { fireEvent, render } from "@testing-library/vue";

import Input from "@/components/common/Input.vue";

describe("Input:", () => {
  it("renders initial empty value", async () => {
    const { container } = render(Input, {
      props: {
        modelValue: "",
      },
    });

    expect(container.querySelector("input")!.value).toEqual("");
  });

  it("renders initial value", async () => {
    const { getByDisplayValue } = render(Input, {
      props: {
        modelValue: "Input value",
      },
    });

    expect(getByDisplayValue("Input value")).toBeTruthy();
  });

  it("emits update:value when value updated", async () => {
    const { container, emitted } = render(Input, {
      props: {
        modelValue: "",
      },
    });
    const input = container.querySelector("input")!;

    await fireEvent.update(input, "Input value");
    expect(emitted()).toHaveProperty("update:modelValue", [["Input value"]]);
  });

  it("input values is updated on value property update", async () => {
    const { container, rerender } = render(Input, {
      props: {
        modelValue: "",
      },
    });

    expect(container.querySelector("input")!.value).toEqual("");

    await rerender({
      modelValue: "Input value",
    });
    expect(container.querySelector("input")!.value).toEqual("Input value");
  });

  it("disables input when disabled is true", async () => {
    const { container } = render(Input, {
      props: {
        modelValue: "",
      },
      attrs: {
        disabled: true,
      },
    });

    expect(container.querySelector("input")!.hasAttribute("disabled")).toEqual(true);
  });

  it("error tooltip is hidden when no error was passed", async () => {
    const { container } = render(Input, {
      props: {
        modelValue: "",
      },
    });
    expect(container.querySelector(".input-error-tooltip")).toBeFalsy();
  });

  it("shows error tooltip and adds class when error prop is not empty", async () => {
    const { container } = render(Input, {
      props: {
        modelValue: "",
        error: "Error test",
      },
    });

    expect(container.querySelector(".input-error-tooltip")).toBeTruthy();
    expect(container.querySelector(".input.error")).toBeTruthy();
  });
});
