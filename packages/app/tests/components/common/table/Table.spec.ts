import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import Table from "@/components/common/table/Table.vue";

describe("Table", () => {
  it("renders properly", () => {
    const { container } = render(Table, {
      props: {
        items: ["item 1", "item 2", "item 3"],
        loading: false,
      },
      slots: {
        "table-head": {
          template: "<th>Table head 1</th>",
        },
        footer: {
          template: "Footer slot",
        },
        loading: {
          template: `<tr class="loading-row">Loading</tr>`,
        },
        "table-row": `<template #table-row="{ item, index }"><td>{{ item }} - {{ index }}</td></template>`,
      },
    });
    expect(container.querySelector("table > thead > tr > th")?.innerHTML).toBe("Table head 1");
    expect(container.querySelector("table > tbody")?.childElementCount).toBe(3);
    expect(container.querySelector("table > tbody")?.innerHTML).toContain("item 1 - 0");
    expect(container.querySelector("table > tbody")?.innerHTML).toContain("item 2 - 1");
    expect(container.querySelector("table > tbody")?.innerHTML).toContain("item 3 - 2");
    expect(container.querySelector(".table-footer")?.innerHTML).toBe("Footer slot");
  });
  it("thead isn't rendered when table-head slot is empty", () => {
    const { container } = render(Table, {
      props: {
        items: [],
        loading: false,
      },
    });
    expect(container.querySelector("thead")).toBeFalsy();
  });
  it("footer isn't rendered when footer slot is empty", () => {
    const { container } = render(Table, {
      props: {
        items: [],
        loading: false,
      },
    });
    expect(container.querySelector(".table-footer")).toBeFalsy();
  });

  it("loading slot is rendered when loading is true", () => {
    const { container } = render(Table, {
      props: {
        items: [],
      },
      slots: {
        loading: {
          template: `<tr class="loading-row">Loading</tr>`,
        },
      },
    });
    expect(container.querySelector(".loading-row")).toBeTruthy();
  });
});
