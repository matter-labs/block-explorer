import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import InfoTooltip from "@/components/common/InfoTooltip.vue";

describe("InfoTooltip:", () => {
  it("renders default slot text on hover", async () => {
    const { container } = render(InfoTooltip, {
      slots: {
        default: {
          template: "InfoTooltip content",
        },
      },
    });
    expect(container.textContent).toBe("InfoTooltip content");
  });
});
