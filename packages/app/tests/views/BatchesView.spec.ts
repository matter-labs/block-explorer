import { ref } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import { useBatchesMock } from "./../mocks";

const routeQueryMock = vi.fn(() => ({}));
vi.mock("vue-router", () => ({
  useRouter: vi.fn(),
  useRoute: () => ({
    query: routeQueryMock(),
  }),
}));

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import BatchesView from "@/views/BatchesView.vue";

const getMockCollection = (length: number) =>
  Array.from({ length }).map((_, index) => ({
    number: index + 1,
    timestamp: "2023-03-20T11:22:06.000Z",
    l1TxCount: 30,
    l2TxCount: 482,
    rootHash: "0xf38cc1eae8f398eb57dea3de1c15390ed02e2f38c9cab2c6cbd1f83fc3976f3c",
    status: "sealed",
  }));

describe("BatchesView:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  let mockBatchCollection: SpyInstance;
  beforeEach(() => {
    routeQueryMock.mockRestore();
  });

  afterEach(() => {
    mockBatchCollection?.mockRestore();
  });

  it("has correct title", async () => {
    mockBatchCollection = useBatchesMock({
      data: ref(getMockCollection(10)),
      total: ref(100),
    });
    expect(i18n.global.t(routes.find((e) => e.name === "batches")?.meta?.title as string)).toBe("Batches");
  });

  it("renders correctly", async () => {
    mockBatchCollection = useBatchesMock({
      data: ref(getMockCollection(10)),
      total: ref(100),
    });
    const wrapper = mount(BatchesView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll(".batches-table tbody tr").length).toBe(10);
    expect(wrapper.findAll(".pagination-page-button.page").length).toBe(4);
  });

  it("uses page query correctly", async () => {
    mockBatchCollection = useBatchesMock({
      data: ref(getMockCollection(10)),
      total: ref(100),
      page: ref(5),
    });
    const wrapper = mount(BatchesView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll(".batches-table tbody tr").length).toBe(10);
    expect(wrapper.findAll(".pagination-page-button.page").length).toBe(5);
  });

  it("do not show pagination when lte 10 batches available", async () => {
    mockBatchCollection = useBatchesMock({
      data: ref(getMockCollection(10)),
      total: ref(10),
    });
    const wrapper = mount(BatchesView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll(".batches-table tbody tr").length).toBe(10);
    expect(wrapper.find(".pagination-container").exists()).toBe(false);
  });
});
