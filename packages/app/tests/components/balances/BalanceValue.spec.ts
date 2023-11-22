import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import BalanceValue from "@/components/balances/BalanceValue.vue";

const token: Api.Response.Token = {
  l1Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
  liquidity: 220000000000,
  usdPrice: 150,
  iconURL: null,
};

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
