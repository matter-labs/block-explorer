import { ref } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

// eslint-disable-next-line import/order
import { useContextMock, useTransactionsMock } from "./../mocks";
import enUS from "@/locales/en.json";

import type { SpyInstance } from "vitest";

const routeQueryMock = vi.fn(() => ({}));
vi.mock("vue-router", () => ({
  useRouter: vi.fn(),
  useRoute: () => ({
    query: routeQueryMock(),
  }),
  createWebHistory: () => vi.fn(),
  createRouter: () => ({ beforeEach: vi.fn() }),
}));

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import TransactionsView from "@/views/TransactionsView.vue";

const getMockCollection = (length: number) =>
  Array.from({ length }).map(() => ({
    hash: "0x8afa27556bc8cf4461ac8d1df68dab4a368aa66d2b35f778b2eb7e07fe334fe7",
    from: "0xcfa3DD0CBa60484d1C8D0cDd22C5432013368875",
    to: "0xde03a0B5963f75f1C8485B355fF6D30f3093BDE7",
    value: "0x2279f530c00",
    status: "verified",
    fee: "0x2279f530c00",
    nonce: 2625,
    blockNumber: 267161,
    receivedAt: "2022-07-11T11:36:29.007307Z",
    data: "0xa9059cbb0000000000000000000000006c557bc88804254760be210c01fd9b6b5de96e530000000000000000000000000000000000000000000000056bc75e2d63100000",
  }));

describe("TransactionsView:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  let mockContext: SpyInstance;
  let mockTransactions: SpyInstance;
  beforeEach(() => {
    routeQueryMock.mockRestore();
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
    mockTransactions?.mockRestore();
  });

  it("has correct title", async () => {
    expect(i18n.global.t(routes.find((e) => e.name === "transactions")?.meta?.title as string)).toBe("Transactions");
  });

  it("renders correctly", async () => {
    mockTransactions = useTransactionsMock({
      data: ref(getMockCollection(10)),
      total: ref(100),
    });
    const wrapper = mount(TransactionsView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll(".transactions-table tbody tr").length).toBe(10);
    expect(wrapper.findAll(".pagination-page-button.page").length).toBe(4);
  });

  it("uses page query correctly", async () => {
    routeQueryMock.mockReturnValue({ page: 5 });
    mockTransactions = useTransactionsMock({
      data: ref(getMockCollection(10)),
      total: ref(100),
    });
    const wrapper = mount(TransactionsView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll(".transactions-table tbody tr").length).toBe(10);
    expect(wrapper.findAll(".pagination-page-button.page").length).toBe(5);
  });
});
