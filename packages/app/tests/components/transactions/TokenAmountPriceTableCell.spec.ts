import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";

import TokenAmountPriceTableCell from "@/components/transactions/TokenAmountPriceTableCell.vue";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import { ETH_TOKEN } from "@/utils/constants";

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

const getTokenPriceMock = vi.fn();

vi.mock("@/composables/useTokenPrice", () => {
  return {
    default: () => ({
      getTokenPrice: getTokenPriceMock,
      tokenPrice: computed(() => "3500"),
    }),
  };
});

describe("TokenAmountPriceTableCell", () => {
  it("renders ETH token when no token provided", async () => {
    const { container } = render(TokenAmountPriceTableCell, {
      global,
      props: {
        amount: "10000000000000000",
      },
    });

    expect(getTokenPriceMock).toHaveBeenCalledWith(ETH_TOKEN.l2Address);
    expect(container.querySelector(".token-amount")?.textContent).toBe("0.01");
    expect(container.querySelector(".token-symbol")?.textContent).toBe(ETH_TOKEN.symbol);
    expect(container.querySelector(".token-price")?.textContent).toBe("$35.00");
  });

  it("renders ERC20 token when token is provided", async () => {
    const erc20Token = {
      l1Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeea",
      l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeb",
      symbol: "ERC",
      name: "ERC",
      decimals: 18,
    };

    const { container } = render(TokenAmountPriceTableCell, {
      global,
      props: {
        amount: "10000000000000000",
        token: erc20Token,
      },
    });

    expect(getTokenPriceMock).toHaveBeenCalledWith(erc20Token.l2Address);
    expect(container.querySelector(".token-amount")?.textContent).toBe("0.01");
    expect(container.querySelector(".token-symbol")?.textContent).toBe(erc20Token.symbol);
    expect(container.querySelector(".token-price")?.textContent).toBe("$35.00");
  });
});
