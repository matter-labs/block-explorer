import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import Table from "@/components/batches/Table.vue";

import enUS from "@/locales/en.json";

import type { BatchListItem } from "@/composables/useBatches";

import $testId from "@/plugins/testId";

describe("Table", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  const batches = [
    {
      number: "2",
      timestamp: "2023-02-07T12:24:08.000Z",
      l1TxCount: 1,
      l2TxCount: 107,
      rootHash: "0x0bcd1b80525cd54303a1596b8241e4f6d8f3acb1c074e3537e6889d9ff10b7cb",
      status: "verified",
    } as BatchListItem,
  ];

  const global = {
    stubs: {
      RouterLink: RouterLinkStub,
    },
    plugins: [i18n, $testId],
  };

  it("renders component properly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 2, 1));
    const wrapper = mount(Table, {
      global,
      props: {
        batches,
        loading: false,
      },
    });

    const headColumn = wrapper.findAll(".table-head-col");

    expect(headColumn[0].text()).toBe("Status");
    expect(headColumn[1].text()).toBe("Batch");
    expect(headColumn[2].text()).toBe("Size");
    expect(headColumn[3].text()).toBe("Age");

    const bodyColumn = wrapper.findAll(".table-body-col");

    expect(bodyColumn[0].text()).toBe("Executed on");
    expect(bodyColumn[1].text()).toBe("#2");
    expect(bodyColumn[2].text()).toBe("108");
    expect(bodyColumn[3].text()).toBe("3 weeks ago");
    vi.useRealTimers();
  });

  it("shows loading state when loading is true", () => {
    const wrapper = mount(Table, {
      global,
      props: {
        loading: true,
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(40);
  });
  it("shows not found message when there are no batches and loading is false", () => {
    const wrapper = mount(Table, {
      global,
      props: {
        batches: [],
        loading: false,
      },
      slots: {
        "not-found": "No batches found.",
      },
    });

    expect(wrapper.find(".batches-not-found").text()).toContain("No batches found.");
  });
  it("renders batch index link", () => {
    const wrapper = mount(Table, {
      global,
      props: {
        batches,
        loading: false,
      },
    });
    expect(wrapper.findAllComponents(RouterLinkStub)[0].props().to.name).toBe("batch");
    expect(wrapper.findAllComponents(RouterLinkStub)[0].props().to.params.id).toBe("2");
  });

  it("renders batch size link", () => {
    const wrapper = mount(Table, {
      global,
      props: {
        batches,
        loading: false,
      },
    });

    expect(wrapper.findAllComponents(RouterLinkStub)[1].props().to.name).toBe("batch");
    expect(wrapper.findAllComponents(RouterLinkStub)[1].props().to.params.id).toBe("2");
  });
});
