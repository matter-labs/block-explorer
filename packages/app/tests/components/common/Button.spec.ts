import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import Button from "@/components/common/Button.vue";

describe("Button:", () => {
  it("applies custom color, size, variant (class properties)", () => {
    const { container } = render(Button, {
      props: {
        color: "secondary",
        size: "md",
        variant: "outlined",
      },
    });

    const element = container.querySelector(".button")!;
    expect(element.classList.contains("secondary")).toBe(true);
    expect(element.classList.contains("md")).toBe(true);
    expect(element.classList.contains("outlined")).toBe(true);
  });
  it("uses custom tag", () => {
    const { container } = render(Button, {
      props: {
        tag: "a",
      },
    });

    expect(container.querySelector("a.button")).not.toBeNull();
  });
  it("loading is visible", () => {
    const { container } = render(Button, {
      props: {
        loading: true,
      },
    });

    expect(container.querySelector(".button-spinner")).not.toBeNull();
  });
  it("renders default slot", () => {
    const { container } = render(Button, {
      slots: {
        default: "Hello",
      },
    });

    expect(container.querySelector(".button")?.textContent).toBe("Hello");
  });
});
