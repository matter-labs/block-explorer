import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import TransactionSquare from "@/components/transactions/TransactionNetworkSquareBlock.vue";

describe("TransactionNetworkSquareBlock:", () => {
  it("renders component", () => {
    const wrapper = mount(TransactionSquare, {
      props: {
        network: "L1",
      },
    });
    expect(wrapper.find(".transactions-data-link-network").text()).toBe("L1");
  });
});
