import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import MarketTokenInfoTable from "@/components/token/MarketTokenInfoTable.vue";

import enUS from "@/locales/en.json";

import type { Token } from "@/composables/useToken";

describe("MarketTokenInfoTable", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  vi.mock("@/components/common/table/fields/TokenPrice.vue", () => ({
    default: {
      name: "TokenPrice",
      template: "<div class='token-price'> $0.33 </div>",
    },
  }));

  it("renders table based on input", () => {
    const wrapper = mount(MarketTokenInfoTable, {
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
      props: {
        tokenInfo: {
          l2Address: "0xc2675AE7F35b7d85Ed1E828CCf6D0376B01ADea3",
          decimals: 4,
          liquidity: 220000000000,
          usdPrice: 0.33,
          name: "Ether",
          symbol: "ETH",
        } as Token,
        loading: false,
      },
    });
    const rowArray = wrapper.findAll("tr");
    const marketCap = rowArray[0].findAll("td");
    expect(marketCap[0].text()).toBe("Market Cap");
    expect(marketCap[1].text()).toBe("$220.00B");

    const price = rowArray[1].findAll("td");
    expect(price[0].text()).toBe("Price");
    expect(price[1].text()).toBe("$0.33");

    const tokenContract = rowArray[2].findAll("td");
    expect(tokenContract[0].text()).toBe("Circulating Supply Market Cap");
    expect(tokenContract[1].text()).toBe("666666666667");
  });

  it("renders loading state", () => {
    const wrapper = mount(MarketTokenInfoTable, {
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
      props: {
        loading: true,
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(6);
  });
});
