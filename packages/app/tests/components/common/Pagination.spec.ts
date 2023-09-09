import { describe, expect, it, vi } from "vitest";

import { fireEvent } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import Pagination from "@/components/common/Pagination.vue";

vi.mock("vue-router", () => ({
  useRouter: () => vi.fn(),
  useRoute: () => ({
    hash: "events",
  }),
}));

describe("Pagination:", () => {
  it("renders default state properly", () => {
    const wrapper = mount(Pagination, {
      props: {
        activePage: 1,
        totalItems: 50,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });
    const pageLinks = wrapper.findAllComponents(RouterLinkStub).filter((e) => e.classes().includes("page"));

    expect(pageLinks.length).toBe(5);
    expect(pageLinks[0].props().to.query).toEqual({});
    for (let a = 2; a < 5; a++) {
      expect(pageLinks[a - 1].props().to.query.page).toBe(a);
    }
    expect(wrapper.find(".pagination-page-button.arrow.left").exists()).toBe(true);
    expect(wrapper.find(".pagination-page-button.arrow.right").exists()).toBe(true);
  });
  it("pagination is disabled when disabled is true", () => {
    const wrapper = mount(Pagination, {
      props: {
        activePage: 1,
        totalItems: 50,
        disabled: true,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });
    expect(wrapper.classes("disabled")).toBe(true);
  });

  describe("Dots:", () => {
    it("pagination renders dots to the left", () => {
      const wrapper = mount(Pagination, {
        props: {
          activePage: 1,
          totalItems: 100,
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });
      expect(wrapper.findAll(".dots").length).toBe(1);
      expect(wrapper.findAll(".pagination-page-button")[4].classes().includes("dots")).toBe(true);
    });
    it("pagination renders dots to the right", () => {
      const wrapper = mount(Pagination, {
        props: {
          activePage: 10,
          totalItems: 100,
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });
      expect(wrapper.findAll(".dots").length).toBe(1);
      expect(wrapper.findAll(".pagination-page-button")[2].classes().includes("dots")).toBe(true);
    });
    it("pagination renders dots to the left and to the right", () => {
      const wrapper = mount(Pagination, {
        props: {
          activePage: 5,
          totalItems: 100,
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });
      expect(wrapper.findAll(".dots").length).toBe(2);
      expect(wrapper.findAll(".pagination-page-button")[2].classes().includes("dots")).toBe(true);
      expect(wrapper.findAll(".pagination-page-button")[6].classes().includes("dots")).toBe(true);
    });
  });
  it("emits update:activePage when page updated", async () => {
    const wrapper = mount(Pagination, {
      props: {
        activePage: 5,
        totalItems: 100,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    await fireEvent.click(wrapper.find(".pagination-page-button.right")!.element);
    expect(wrapper.emitted("update:activePage")).toEqual([[5], [5], [5], [6]]);
  });
  describe("Back & Next buttons:", () => {
    it("back button doesn't have a query and is disabled if first page is active", () => {
      const wrapper = mount(Pagination, {
        props: {
          activePage: 1,
          totalItems: 50,
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });
      const pageLinks = wrapper.findAllComponents(RouterLinkStub).filter((e) => e.classes().includes("arrow"));
      expect(pageLinks[0].props().to.query).toEqual({});
      expect(pageLinks[0].classes().includes("disabled")).toEqual(true);
    });
    it("next button is disabled if last page is active", () => {
      const wrapper = mount(Pagination, {
        props: {
          activePage: 5,
          totalItems: 50,
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });
      const pageLinks = wrapper.findAllComponents(RouterLinkStub).filter((e) => e.classes().includes("arrow"));
      expect(pageLinks[1].props().to.query.page).toBe(5);
      expect(pageLinks[1].classes().includes("disabled")).toEqual(true);
    });
    it("back and next button have correct query", () => {
      const wrapper = mount(Pagination, {
        props: {
          activePage: 3,
          totalItems: 50,
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      });
      const pageLinks = wrapper.findAllComponents(RouterLinkStub).filter((e) => e.classes().includes("arrow"));
      expect(pageLinks[0].props().to.query.page).toBe(2);
      expect(pageLinks[0].classes().includes("disabled")).toEqual(false);
      expect(pageLinks[1].props().to.query.page).toBe(4);
      expect(pageLinks[1].classes().includes("disabled")).toEqual(false);
    });
  });
  it("renders correct hash for the links if route hash exists", () => {
    const wrapper = mount(Pagination, {
      props: {
        activePage: 2,
        totalItems: 30,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });
    const pageLinks = wrapper.findAllComponents(RouterLinkStub);

    expect(pageLinks[0].props().to.hash).toBe("events");
    expect(pageLinks[1].props().to.hash).toBe("events");
    expect(pageLinks[2].props().to.hash).toBe("events");
    expect(pageLinks[3].props().to.hash).toBe("events");
  });
});
