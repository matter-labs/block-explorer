import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";

describe("TableBodyColumn", () => {
  it("renders properly", () => {
    const { container } = render(TableBodyColumn, {
      slots: {
        default: {
          template: "Default slot",
        },
      },
    });
    expect(container.textContent).toBe("Default slot");
  });
});
