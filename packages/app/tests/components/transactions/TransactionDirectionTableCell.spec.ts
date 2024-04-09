import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import TransactionDirectionTableCell from "@/components/transactions/TransactionDirectionTableCell.vue";

describe("TransactionDirectionTableCell:", () => {
  it("renders 'in' state properly", () => {
    const wrapper = mount(TransactionDirectionTableCell, {
      props: {
        text: "in",
      },
    });
    expect(wrapper.find(".incoming").exists()).toBe(true);
    expect(wrapper.find(".incoming").text()).toBe("in");
  });
  it("renders 'out' state properly", () => {
    const wrapper = mount(TransactionDirectionTableCell, {
      props: {
        text: "out",
      },
    });
    expect(wrapper.find(".outcoming").exists()).toBe(true);
    expect(wrapper.find(".outcoming").text()).toBe("out");
  });
  it("renders 'self' state properly", () => {
    const wrapper = mount(TransactionDirectionTableCell, {
      props: {
        text: "self",
      },
    });
    expect(wrapper.find(".self").exists()).toBe(true);
    expect(wrapper.find(".self").text()).toBe("self");
  });
});
