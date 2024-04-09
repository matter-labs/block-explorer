import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import Breadcrumbs from "@/components/common/Breadcrumbs.vue";

import enUS from "@/locales/en.json";

import type { BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";

describe("Breadcrumbs:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders links correctly", () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        items: <BreadcrumbItem[]>[
          { text: "Dashboard", to: "/" },
          { text: "Blocks", to: "/blocks" },
          { text: "Transaction" },
        ],
      },
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });
    const breadcrumbLinks = wrapper.findAll(".breadcrumb-item-link");

    expect(breadcrumbLinks.length).toBe(2);
    expect(breadcrumbLinks[0].attributes("to")).toBe("/");
    expect(breadcrumbLinks[1].attributes("to")).toBe("/blocks");
    expect(wrapper.find(".breadcrumb-item-active").element.tagName).toBe("SPAN");
    expect(wrapper.find(".breadcrumb-item-active").text()).toBe("Transaction");
  });
});
