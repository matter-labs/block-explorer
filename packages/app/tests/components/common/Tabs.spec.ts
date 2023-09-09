import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import Tabs from "@/components/common/Tabs.vue";

const router = {
  push: vi.fn(),
};

vi.mock("vue-router", () => ({
  useRouter: () => router,
  useRoute: () => vi.fn(),
}));

describe("Tabs", () => {
  it("renders component with default empty slots", () => {
    const wrapper = mount(Tabs, {
      props: {
        tabs: [
          { title: "Tab 1", hash: "tab1" },
          { title: "Tab 2", hash: "tab2" },
        ],
      },
    });
    expect(wrapper.findAll(".tab-head li").length).toBe(2);
    expect(wrapper.findAll(".tab-head li")[0].text()).toBe("Tab 1");
    expect(wrapper.findAll(".tab-head li")[1].text()).toBe("Tab 2");
    expect(wrapper.findAll(".tab-content > div").length).toBe(2);
    expect(wrapper.findAll(".tab-content > div")[0].text()).toBe("");
    expect(wrapper.findAll(".tab-content > div")[1].text()).toBe("");
  });
  it("renders component with custom slots values", () => {
    const wrapper = mount(Tabs, {
      props: {
        tabs: [
          { title: "Tab 1", hash: "tab1" },
          { title: "Tab 2", hash: "tab2" },
        ],
      },
      slots: {
        "tab-1-content": {
          template: "Tab 1 slot content",
        },
        "tab-2-content": {
          template: "Tab 2 slot content",
        },
      },
    });
    expect(wrapper.findAll(".tab-head li").length).toBe(2);
    expect(wrapper.findAll(".tab-head li")[0].text()).toBe("Tab 1");
    expect(wrapper.findAll(".tab-head li")[1].text()).toBe("Tab 2");
    expect(wrapper.findAll(".tab-content > div").length).toBe(2);
    expect(wrapper.findAll(".tab-content > div")[0].text()).toBe("Tab 1 slot content");
    expect(wrapper.findAll(".tab-content > div")[1].text()).toBe("Tab 2 slot content");
  });
  it("redirects to current tab hash on tab button click", async () => {
    const wrapper = mount(Tabs, {
      props: {
        tabs: [
          { title: "Tab 1", hash: "tab1" },
          { title: "Tab 2", hash: "tab2" },
        ],
      },
    });

    await wrapper.findAll(".tab-btn")[1].trigger("click");

    expect(router.push).toHaveBeenCalledWith({
      hash: "tab2",
    });
  });
});
