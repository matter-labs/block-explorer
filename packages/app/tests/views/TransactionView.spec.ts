import { ref } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import { useTransactionMock } from "./../mocks";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import TransactionView from "@/views/TransactionView.vue";

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
  useRoute: () => ({
    query: {},
  }),
  createWebHistory: () => vi.fn(),
  createRouter: () => ({ beforeEach: vi.fn() }),
}));

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(),
    FetchError: function error() {
      return;
    },
  };
});

describe("TransactionView:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("has correct title", async () => {
    expect(i18n.global.t(routes.find((e) => e.name === "transaction")?.meta?.title as string)).toBe("Transaction");
  });

  it("route is replaced with not found view on request 404 error", async () => {
    const isRequestPending = ref(true);

    const mock = useTransactionMock({
      isRequestFailed: isRequestPending,
    });

    mount(TransactionView, {
      props: {
        hash: "0x4d282bfaa673c686041a2e93ab0c1ca8ffc937a212b069669cd62c1725afc43d",
      },
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    isRequestPending.value = false;
    await new Promise((resolve) => setImmediate(resolve));

    expect(router.replace).toHaveBeenCalledWith(notFoundRoute);
    mock.mockRestore();
  });
});
