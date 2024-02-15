import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import TokenAmountPrice from "@/components/TokenAmountPrice.vue";

import enUS from "@/locales/en.json";

import type { Token } from "@/composables/useToken";

import $testId from "@/plugins/testId";

const ethToken = {
  l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  symbol: "ETH",
  name: "ETH",
  decimals: 18,
  usdPrice: 3500,
} as Token;
const usdcToken = {
  l2Address: "0xf6947d8dd3a019a151c1a44dc94033be15cb12f8",
  symbol: "USDC",
  name: "USDC",
  decimals: 3,
  usdPrice: 3500,
} as Token;

const i18n = createI18n({
  locale: "en",
  allowComposition: true,
  messages: {
    en: enUS,
  },
});

const global = {
  stubs: {
    RouterLink: RouterLinkStub,
  },
  plugins: [$testId, i18n],
};

describe("TokenAmountPrice", () => {
  it("renders amount and token correctly", async () => {
    const wrapper = mount(TokenAmountPrice, {
      global,
      props: {
        token: ethToken,
        amount: "10000000000000000",
      },
    });
    expect(wrapper.find(".token-amount").text()).toBe("0.01");
    expect(wrapper.find(".token-symbol").text()).toBe(ethToken.symbol);
  });
  it("handles amount update correctly", async () => {
    const wrapper = mount(TokenAmountPrice, {
      global,
      props: {
        token: ethToken,
        amount: "10000000000000000",
      },
    });
    expect(wrapper.find(".token-amount").text()).toBe("0.01");
    await wrapper.setProps({
      amount: "10000",
    });
    expect(wrapper.find(".token-amount").text()).toBe("0.00000000000001");
  });
  it("handles token address update correctly", async () => {
    const wrapper = mount(TokenAmountPrice, {
      global,
      props: {
        token: ethToken,
        amount: "10000000000000000",
      },
    });
    await wrapper.setProps({
      token: usdcToken,
    });
    expect(wrapper.find(".token-amount").text()).toBe("10000000000000");
    expect(wrapper.find(".token-symbol").text()).toBe(usdcToken.symbol);
  });
  it("renders price bigger than 0.00001 correctly", async () => {
    const wrapper = mount(TokenAmountPrice, {
      global,
      props: {
        token: ethToken,
        amount: "10000000000000000",
      },
    });
    expect(wrapper.find(".token-price").text()).toBe("$35.00");
  });
  it("renders price smaller than 0.00001 correctly", async () => {
    const wrapper = mount(TokenAmountPrice, {
      global,
      props: {
        token: ethToken,
        amount: "1000",
      },
    });
    expect(wrapper.find(".token-price").text()).toBe("<$0.00001");
  });
  it("renders price '0' correctly", async () => {
    const wrapper = mount(TokenAmountPrice, {
      global,
      props: {
        token: ethToken,
        amount: "0",
      },
    });
    expect(wrapper.find(".token-price").text()).toBe("$0");
  });
});
