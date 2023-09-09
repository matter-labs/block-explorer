import { describe, expect, it, vi } from "vitest";

import { computed } from "vue";

import { mount } from "@vue/test-utils";

import BalanceValue from "@/components/balances/BalanceValue.vue";

const token: Api.Response.Token = {
  l1Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
};
vi.mock("@/composables/useTokenPrice", () => {
  return {
    default: () => ({
      getTokenPrice: async () => undefined,
      tokenPrice: computed(() => "150"),
    }),
  };
});

describe("BalanceValue:", () => {
  it("renders component based on input", async () => {
    const wrapper = mount(BalanceValue, {
      props: {
        balance: {
          balance: "100000000000000000000",
          token,
        },
      },
    });
    expect(wrapper.find(".balance-data-value").text()).toBe("100.0");
    expect(wrapper.find(".balance-data-price").text()).toBe("$15,000.00");
  });
});
