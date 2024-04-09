import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import Tooltip from "@/components/common/Tooltip.vue";

describe("Tooltip:", () => {
  it("renders default slot", () => {
    const { container } = render(Tooltip, {
      slots: {
        default: {
          template: "Tooltip content",
        },
      },
    });
    expect(container.textContent).toBe("Tooltip content");
  });
});
