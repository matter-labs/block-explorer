import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import Alert from "@/components/common/Alert.vue";

describe("Alert", () => {
  it("renders default slot", () => {
    const { container } = render(Alert, {
      slots: {
        default: {
          template: "Alert",
        },
      },
    });
    expect(container.textContent).toBe("Alert");
  });
  it("properly uses type prop", async () => {
    const { container } = render(Alert, {
      props: {
        type: "warning",
      },
    });
    expect(container.innerHTML).includes("warning");
  });
});
