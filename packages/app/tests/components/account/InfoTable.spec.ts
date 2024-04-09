import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import InfoTable from "@/components/account/InfoTable.vue";

import enUS from "@/locales/en.json";

import type { Account } from "@/composables/useAddress";

describe("InfoTable:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders table based on input", () => {
    const wrapper = mount(InfoTable, {
      global: {
        plugins: [i18n],
      },
      props: {
        account: <Account>{
          address: "0x481e48ce19781c3ca573967216dee75fdcf70f54",
          balances: {},
          sealedNonce: 1,
          verifiedNonce: 1,
        },
        loading: false,
      },
    });

    const rowArray = wrapper.findAll("tbody tr");
    const address = rowArray[0].findAll("td");
    expect(address[0].text()).toBe("Address");
    expect(address[1].text()).toBe("0x481e48ce19781c3ca573967216dee75fdcf70f54");
    const committed = rowArray[1].findAll("td");
    expect(committed[0].text()).toBe("Committed nonce");
    expect(committed[1].text()).toBe("1");
    const verified = rowArray[2].findAll("td");
    expect(verified[0].text()).toBe("Verified nonce");
    expect(verified[1].text()).toBe("1");
  });
  it("renders loading state", () => {
    const wrapper = mount(InfoTable, {
      global: {
        plugins: [i18n],
      },
      props: {
        loading: true,
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(6);
  });
});
