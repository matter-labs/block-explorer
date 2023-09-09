import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";
import { mount } from "@vue/test-utils";
import { useTimeAgo } from "@vueuse/core";

import Table from "@/components/blocks/Table.vue";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import { localDateFromISOString } from "@/utils/helpers";

describe("Table", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders properly", () => {
    const wrapper = mount(Table, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
      props: {
        loading: false,
        blocks: [
          {
            number: 9001,
            hash: "0x01ee8af7626f87e046f212c59e4505ef64d3fa5746db26bec7b46566420321f3",
            timestamp: "2022-02-23T08:58:20.000Z",
            gasUsed: "0x0",
            l1BatchNumber: 10,
            l1TxCount: 1,
            l2TxCount: 58,
            size: 10,
            status: "verified",
            isL1BatchSealed: false,
          },
        ],
      },
    });
    expect(wrapper.find(".block-data-txns-amount").text()).toContain("59");
    expect(wrapper.find(".block-data-status").text()).toBe("Verified");
    expect(wrapper.find(".time-ago").text()).toBe(useTimeAgo(localDateFromISOString("2022-02-23T08:58:20.000Z")).value);
  });

  it("renders loading state", () => {
    const wrapper = mount(Table, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
      props: {
        loading: true,
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(40);
  });

  it("renders custom loading rows number", () => {
    const wrapper = mount(Table, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
      props: {
        loading: true,
        loadingRows: 10,
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(40);
  });
  it("renders empty state with the default slot value", () => {
    const { getByText } = render(Table, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
      props: {
        loading: false,
      },
    });
    getByText("Not Found");
  });
  it("renders empty state with the slot value", () => {
    const { getByText } = render(Table, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
      slots: {
        "not-found": `<p>We haven't had any  blocks yet. Please, check again later.</p>`,
      },
      props: {
        loading: false,
      },
    });
    getByText("We haven't had any blocks yet. Please, check again later.");
  });
  it("does not render header when blocks collection is empty", () => {
    const { container } = render(Table, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
      props: {
        blocks: [],
        loading: false,
      },
    });
    expect(container.querySelectorAll(".table-head-col")).toHaveLength(0);
  });
});
