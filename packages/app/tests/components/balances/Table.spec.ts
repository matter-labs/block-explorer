import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import { ETH_TOKEN_MOCK } from "../../mocks";

import Table from "@/components/balances/Table.vue";

import enUS from "@/locales/en.json";

import type { Balances } from "@/composables/useAddress";

import $testId from "@/plugins/testId";

const tokenETH: Api.Response.Token = ETH_TOKEN_MOCK;
const tokenLINK: Api.Response.Token = {
  l1Address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  l2Address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  symbol: "LINK",
  name: "ChainLink Token (goerli)",
  decimals: 18,
  usdPrice: 100,
  liquidity: 100000000,
  iconURL: null,
};
const tokenWBTC: Api.Response.Token = {
  l1Address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  l2Address: "0xCA063A2AB07491eE991dCecb456D1265f842b568",
  symbol: "wBTC",
  name: "Wrapped BTC",
  decimals: 8,
  usdPrice: 35000,
  liquidity: 10000000000,
  iconURL: null,
};

vi.mock("@/composables/useTokenLibrary", () => {
  return {
    default: () => ({
      getToken: (address: string) => [tokenETH, tokenWBTC].find((token) => token.l2Address === address),
      getTokens: () => undefined,
      isRequestFailed: computed(() => false),
      isRequestPending: computed(() => false),
    }),
  };
});

describe("Table:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders empty table slot", () => {
    const wrapper = mount(Table, {
      global: {
        plugins: [i18n, $testId],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: {
        balances: {},
        loading: false,
      },
    });
    expect(wrapper.find(".balances-not-found").text()).toBe("Not Found");
  });
  it("renders table based on input", async () => {
    const wrapper = mount(Table, {
      global: {
        plugins: [i18n, $testId],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: {
        loading: false,
        balances: <Balances>{
          [tokenETH.l2Address]: {
            balance: "100000000000000000000",
            token: tokenETH,
          },
        },
      },
    });
    const row = wrapper.find("tbody tr");
    const col = row.findAll("td");
    expect(col[0].find("span").text()).toBe("ETH");
    expect(col[1].text()).toBe("100.0$180,000.00");
    expect(col[2].find("span").text()).toBe("0x000000000000000000000000000000000000800A");
  });
  it("renders loading state", () => {
    const wrapper = mount(Table, {
      global: {
        plugins: [i18n, $testId],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: {
        loading: true,
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(9);
  });
  it("renders balances ETH first, then library tokens, then all other, null symbols last", () => {
    const wrapper = mount(Table, {
      global: {
        plugins: [i18n, $testId],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: {
        loading: false,
        balances: <Balances>{
          [tokenETH.l2Address]: {
            balance: "100000000000000000000",
            token: tokenETH,
          },
          [tokenLINK.l2Address]: {
            balance: "100000000000000000000",
            token: tokenLINK,
          },
          [tokenWBTC.l2Address]: {
            balance: "100000000000000000000",
            token: tokenWBTC,
          },
          "some-address": {
            balance: "100000000000000000000",
            token: {
              l1Address: "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
              l2Address: "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
              symbol: null,
              name: null,
              decimals: 8,
            } as Api.Response.Token,
          },
        },
      },
    });

    const symbols = wrapper.findAll(".token-symbol");
    expect(symbols[0].text()).toBe("ETH");
    expect(symbols[1].text()).toBe("wBTC");
    expect(symbols[2].text()).toBe("LINK");
    expect(symbols[3].text()).toBe("unknown");
  });
  it("renders all balances after 'show all balance' button clicked", async () => {
    const wrapper = mount(Table, {
      global: {
        plugins: [i18n, $testId],
        stubs: { RouterLink: RouterLinkStub },
      },
      props: {
        loading: false,
        balances: <Balances>{
          [tokenETH.l2Address]: {
            balance: "100000000000000000000",
            token: tokenETH,
          },
          [tokenLINK.l2Address]: {
            balance: "100000000000000000000",
            token: tokenLINK,
          },
          [tokenWBTC.l2Address]: {
            balance: "100000000000000000000",
            token: tokenWBTC,
          },
          "4": {
            balance: "100000000000000000000",
            token: tokenETH,
          },
          "5": {
            balance: "100000000000000000000",
            token: tokenLINK,
          },
          "6": {
            balance: "100000000000000000000",
            token: tokenWBTC,
          },
        },
      },
    });

    const button = wrapper.find(".load-all button");
    expect(wrapper.findAll("tbody tr").length).toBe(5);
    expect(button.text()).toBe(i18n.global.t("balances.table.showAll") + " (6)");
    await button.trigger("click");
    expect(wrapper.findAll("tbody tr").length).toBe(6);
  });
  it("doesn't render the header when there are no balances", () => {
    const wrapper = mount(Table, {
      global: {
        plugins: [i18n, $testId],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: {
        loading: false,
        balances: {},
      },
    });
    expect(wrapper.findAll(".table-head-col")).toHaveLength(0);
  });
});
