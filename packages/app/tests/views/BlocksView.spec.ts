import { ref } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import { useBlocksMock, useContextMock } from "./../mocks";

const routeQueryMock = vi.fn(() => ({}));
vi.mock("vue-router", () => ({
  useRouter: vi.fn(),
  useRoute: () => ({
    query: routeQueryMock(),
  }),
  createWebHistory: () => vi.fn(),
  createRouter: () => ({ beforeEach: vi.fn() }),
}));

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import BlocksView from "@/views/BlocksView.vue";

const getMockCollection = (length: number) =>
  Array.from({ length }).map((_, index) => ({
    number: index + 1,
    l1TxCount: 1,
    l2TxCount: 58,
    hash: "0x01ee8af7626f87e046f212c59e4505ef64d3fa5746db26bec7b46566420321f3",
    status: "executed",
    timestamp: "2022-02-23T08:58:20.000Z",
  }));

describe("BlocksView:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  let mockContext: SpyInstance;
  let mockBlockCollection: SpyInstance;
  beforeEach(() => {
    routeQueryMock.mockRestore();
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
    mockBlockCollection?.mockRestore();
  });

  it("has correct title", async () => {
    mockBlockCollection = useBlocksMock({
      data: ref(getMockCollection(10)),
      total: ref(100),
    });
    expect(i18n.global.t(routes.find((e) => e.name === "blocks")?.meta?.title as string)).toBe("Blocks");
  });

  it("renders correctly", async () => {
    mockBlockCollection = useBlocksMock({
      data: ref(getMockCollection(10)),
      total: ref(100),
    });
    const wrapper = mount(BlocksView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll(".blocks-table tbody tr").length).toBe(10);
    expect(wrapper.findAll(".pagination-page-button.page").length).toBe(4);
  });

  it("uses page query correctly", async () => {
    mockBlockCollection = useBlocksMock({
      data: ref(getMockCollection(10)),
      total: ref(100),
      page: ref(5),
    });
    const wrapper = mount(BlocksView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll(".blocks-table tbody tr").length).toBe(10);
    expect(wrapper.findAll(".pagination-page-button.page").length).toBe(5);
  });

  it("do not show pagination when lte 10 blocks available", async () => {
    mockBlockCollection = useBlocksMock({
      data: ref(getMockCollection(10)),
      total: ref(10),
    });
    const wrapper = mount(BlocksView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll(".blocks-table tbody tr").length).toBe(10);
    expect(wrapper.find(".pagination-container").exists()).toBe(false);
  });
});
