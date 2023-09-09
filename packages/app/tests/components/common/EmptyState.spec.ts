import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import EmptyState from "@/components/common/EmptyState.vue";

describe("EmptyState", () => {
  it("renders component with default slots values", () => {
    const wrapper = mount(EmptyState);
    expect(wrapper.find(".state-image svg")).toBeDefined();
    expect(wrapper.find(".title").text()).toBe("Not found");
    expect(wrapper.find(".description").text()).toBe("Please, try again later");
  });
  it("renders component with custom slots values", () => {
    const wrapper = mount(EmptyState, {
      slots: {
        image: {
          template: ` <img src="/images/empty-state/empty_balance.svg" />`,
        },
        title: {
          template: "Title",
        },
        description: {
          template: "Description",
        },
      },
    });
    expect(wrapper.find(".state-image img").attributes("src")).toBe("/images/empty-state/empty_balance.svg");
    expect(wrapper.find(".title").text()).toBe("Title");
    expect(wrapper.find(".description").text()).toBe("Description");
  });
});
