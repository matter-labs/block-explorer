import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import enUS from "@/locales/en.json";

import type { SpyInstance } from "vitest";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import BatchView from "@/views/BatchView.vue";

const router = {
  resolve: vi.fn(),
  replace: vi.fn(),
  currentRoute: {
    value: {},
  },
};
const routeQueryMock = vi.fn(() => ({}));

vi.mock("@/composables/useSearch", () => {
  return {
    default: () => ({
      getSearchRoute: () => null,
    }),
  };
});

vi.mock("vue-router", () => ({
  useRouter: () => router,
  useRoute: () => ({
    query: routeQueryMock(),
  }),
  createWebHistory: () => vi.fn(),
  createRouter: () => vi.fn(),
}));

vi.mock("ohmyfetch", () => {
  const fetchSpy = vi.fn();
  (fetchSpy as unknown as { create: SpyInstance }).create = vi.fn(() => fetchSpy);
  return {
    $fetch: fetchSpy,
    FetchError: function error() {
      return;
    },
  };
});

describe("BatchView:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("has correct title", async () => {
    expect(i18n.global.t(routes.find((e) => e.name === "batch")?.meta?.title as string)).toBe("Batch");
  });

  it("shows correct trimmed title", () => {
    const wrapper = mount(BatchView, {
      props: {
        id: "0042",
      },
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.find(".breadcrumb-item span").text()).toBe("Batch #42");
  });
});
