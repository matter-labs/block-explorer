import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import TableHeadColumn from "@/components/common/table/TableHeadColumn.vue";

describe("TableHeadColumn", () => {
  it("renders properly", () => {
    const { container } = render(TableHeadColumn, {
      slots: {
        default: {
          template: "Default slot",
        },
      },
    });
    expect(container.textContent).toBe("Default slot");
  });
});
