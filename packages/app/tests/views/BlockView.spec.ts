import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";
import { $fetch, FetchError } from "ohmyfetch";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import BlockView from "@/views/BlockView.vue";

const notFoundRoute = { name: "not-found", meta: { title: "404 Not Found" } };
const router = {
  resolve: vi.fn(() => notFoundRoute),
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

  it("route is replaced with not found view on request 404 error", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error: any = new FetchError("404");
    error.response = {
      status: 404,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mock = ($fetch as any).mockRejectedValue(error);
    mount(BlockView, {
      props: {
        id: "12",
      },
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(router.replace).toHaveBeenCalledWith(notFoundRoute);
    mock.mockRestore();
  });
  it("shows correct trimmed title", () => {
    const wrapper = mount(BlockView, {
      props: {
        id: "0042",
      },
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });
    expect(wrapper.find(".breadcrumb-item span").text()).toBe("Block #42");
  });
});
