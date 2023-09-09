import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import TimeField from "@/components/common/table/fields/TimeField.vue";

import enUS from "@/locales/en.json";

describe("TimeField", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  const global = {
    plugins: [i18n],
  };
  it("renders title in UTC format", () => {
    const { container, unmount } = render(TimeField, {
      global,
      props: {
        value: "2022-12-02T09:26:06.605Z",
      },
    });

    expect(container.querySelector(".info-field-time")?.getAttribute("title")).toBe("2022-12-02 09:26:06 UTC");
    unmount();
  });
  it("renders full date when showExactDate is true by default", () => {
    const { container, unmount } = render(TimeField, {
      global,
      props: {
        value: "2022-12-02T09:26:06.605Z",
      },
    });

    expect(container.querySelector(".full-date")?.textContent).toBe("2022-12-02 12:26");
    unmount();
  });
  it("doesn't render full date when showExactDate is false", () => {
    const { container, unmount } = render(TimeField, {
      global,
      props: {
        value: "2022-12-02T09:26:06.605Z",
        showExactDate: false,
      },
    });

    expect(container.querySelector(".full-date")).toBeNull();
    unmount();
  });
});
