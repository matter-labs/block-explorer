/* eslint-disable @typescript-eslint/no-explicit-any */

import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { fireEvent } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import TheHeader from "@/components/header/TheHeader.vue";

import enUS from "@/locales/en.json";

const routeMock = vi.fn(() => ({ name: "home", params: {} }));
vi.mock("vue-router", () => ({
  useRoute: () => routeMock(),
}));

const maintenanceMock = vi.fn(() => false);
vi.mock("@/composables/useContext", () => {
  return {
    default: () => ({
      currentNetwork: computed(() => ({
        maintenance: maintenanceMock(),
        bridgeUrl: "https://bridge.zksync.io/",
        apiUrl: "https://api-url",
      })),
      networks: computed(() => []),
      user: computed(() => ({ loggedIn: false })),
    }),
  };
});

describe("TheHeader:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders navigation links", async () => {
    const wrapper = mount(TheHeader, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
        plugins: [i18n],
      },
    });
    const dropdown = wrapper.findAll(".dropdown-container");
    await fireEvent.click(dropdown[0].find("button")!.element);
    const blockExplorerLinks = dropdown[0].findAllComponents(RouterLinkStub);
    expect(blockExplorerLinks[0].props().to.name).toBe("blocks");
    expect(blockExplorerLinks[1].props().to.name).toBe("transactions");
    expect(blockExplorerLinks[2].props().to.name).toBe("tokens");

    await fireEvent.click(dropdown[1].find("button")!.element);
    const toolsLinksRouter = dropdown[1].findAllComponents(RouterLinkStub);
    const toolsLinks = dropdown[1].findAll("a");
    expect(toolsLinks[0].attributes("href")).toBe("https://api-url/docs");
    expect(toolsLinksRouter[0].props().to.name).toBe("contract-verification");
    expect(toolsLinks[2].attributes("href")).toBe("https://bridge.zksync.io/");

    expect(wrapper.findAll(".navigation-container > .navigation-link")[0].attributes("href")).toBe(
      "https://docs.zksync.io/zksync-network/tooling/block-explorers"
    );
  });
  it("renders social links", () => {
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });
    const routerArray = wrapper.findAll(".socials-container > a");
    expect(routerArray[0].attributes("href")).toBe("https://join.zksync.dev");
    expect(routerArray[1].attributes("href")).toBe("https://x.com/zksync");
  });
  it("renders network switch", () => {
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });
    expect(wrapper.find(".network-switch")).toBeTruthy();
  });
  it("renders hero banner container by default", async () => {
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });

    expect(wrapper.find(".hero-banner-container").exists()).toBe(true);
  });
  it("doesn't render hero banner for not-found route", async () => {
    const mockRoute = routeMock.mockReturnValue({ name: "not-found", params: {} });
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });

    expect(wrapper.find(".hero-banner-container").exists()).toBe(false);
    mockRoute.mockRestore();
  });
  it("doesn't render hero banner if network maintenance is true", async () => {
    const mockRoute = routeMock.mockReturnValue({ name: "not-found", params: {} });
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });

    expect(wrapper.find(".hero-banner-container").exists()).toBe(false);
    mockRoute.mockRestore();
  });
  it("doesn't render hero banner if transaction hash is invalid", async () => {
    const mockRoute = routeMock.mockReturnValue({ name: "transaction", params: { hash: "asdasd" } });
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });

    expect(wrapper.find(".hero-banner-container").exists()).toBe(false);
    mockRoute.mockRestore();
  });
  it("doesn't render hero banner if address is invalid", async () => {
    const mockRoute = routeMock.mockReturnValue({ name: "address", params: { address: "asdasd" } });
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });

    expect(wrapper.find(".hero-banner-container").exists()).toBe(false);
    mockRoute.mockRestore();
  });
  it("doesn't render hero banner if block id is invalid", async () => {
    const mockRoute = routeMock.mockReturnValue({ name: "block", params: { id: "asdasd" } });
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });

    expect(wrapper.find(".hero-banner-container").exists()).toBe(false);
    mockRoute.mockRestore();
  });
});
