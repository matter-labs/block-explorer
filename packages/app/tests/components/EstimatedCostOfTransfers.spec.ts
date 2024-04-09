import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import EstimatedCostOfTransfers from "@/components/EstimatedCostOfTransfers.vue";

import enUS from "@/locales/en.json";

describe("EstimatedCostOfTransfers:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders component base on props", () => {
    const { container } = render(EstimatedCostOfTransfers, {
      props: {
        costs: [
          {
            label: "Test1 label",
            value: 44.5,
            description: "Test1 description",
          },
          {
            label: "Test2 label",
            value: 72.2,
          },
        ],
      },
      global: {
        plugins: [i18n],
      },
    });

    const costs = container.querySelectorAll(".cost");
    const popover = container.querySelectorAll(".popover-container");

    expect(popover[0].textContent).toContain("?");
    expect(costs[0].textContent).toContain("Test1 label");
    expect(costs[0].textContent).toContain("$44.5");
    expect(costs[1].textContent).toContain("Test2 label");
    expect(costs[1].textContent).toContain("$72.2");
  });
});
