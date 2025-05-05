import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import OverviewTokenInfoTable from "@/components/token/OverviewTokenInfoTable.vue";

import enUS from "@/locales/en.json";

import type { Token } from "@/composables/useToken";

describe("OverviewTokenInfoTable", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders table based on input", () => {
    const wrapper = mount(OverviewTokenInfoTable, {
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
      props: {
        tokenInfo: {
          l2Address: "0xc2675AE7F35b7d85Ed1E828CCf6D0376B01ADea3",
          decimals: 18,
          liquidity: 220000000000,
          name: "Ether",
          symbol: "ETH",
        } as Token,
        tokenOverview: {
          totalSupply: 100000000000000000000000000,
        },
        loading: false,
      },
    });
    const rowArray = wrapper.findAll("tr");
    const maxTotalSupply = rowArray[0].findAll("td");
    expect(maxTotalSupply[0].text()).toBe("Max Total Supply");
    expect(maxTotalSupply[1].text()).toBe("100000000.000000004764729344");

    const tokenContract = rowArray[1].findAll("td");
    expect(tokenContract[0].text()).toBe("Token Contract");
    expect(tokenContract[1].text()).toBe("0xc2675AE7F35b...Dea3");
    const [tokenLink] = tokenContract[1].findAllComponents(RouterLinkStub);
    expect(tokenLink).toBeTruthy();
    expect(tokenLink.props().to.name).toBe("address");
    expect(tokenLink.props().to.params.address).toBe("0xc2675AE7F35b7d85Ed1E828CCf6D0376B01ADea3");
  });

  it("renders loading state", () => {
    const wrapper = mount(OverviewTokenInfoTable, {
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
