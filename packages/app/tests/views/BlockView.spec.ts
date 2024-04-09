import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import BlockView from "@/views/BlockView.vue";

const router = {
  resolve: vi.fn(),
  replace: vi.fn(),
  currentRoute: {
    value: {},
  },
};

vi.mock("@/composables/useSearch", () => {
  return {
    default: () => ({
      getSearchRoute: () => null,
    }),
  };
});

vi.mock("vue-router", () => ({
  useRouter: () => router,
  useRoute: () => vi.fn(),
}));

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(),
    FetchError: function error() {
      return;
    },
  };
});

describe("BlockView:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("has correct title", async () => {
    expect(i18n.global.t(routes.find((e) => e.name === "block")?.meta?.title as string)).toBe("Block");
  });

  it("shows correct trimmed title", () => {
    const wrapper = mount(BlockView, {
      props: {
        id: "0042",
      },
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });
    expect(wrapper.find(".breadcrumb-item span").text()).toBe("Block #42");
  });
});
