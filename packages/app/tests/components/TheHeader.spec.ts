/* eslint-disable @typescript-eslint/no-explicit-any */

import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import TheHeader from "@/components/header/TheHeader.vue";

import enUS from "@/locales/en.json";

const routeMock = vi.fn(() => ({ name: "home", params: {} }));
vi.mock("vue-router", () => ({
  useRoute: () => routeMock(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const maintenanceMock = vi.fn(() => false);
const networkOverridesMock = vi.fn(() => ({}));
const userMock = vi.fn((): Record<string, unknown> => ({ loggedIn: false }));
vi.mock("@/composables/useContext", () => {
  return {
    default: () => ({
      currentNetwork: computed(() => ({
        maintenance: maintenanceMock(),
        bridgeUrl: "https://bridge.zksync.io/",
        apiUrl: "https://api-url",
        ...networkOverridesMock(),
      })),
      networks: computed(() => []),
      user: computed(() => userMock()),
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
      "https://docs.zksync.io"
    );
  });
  describe("in Prividium mode", () => {
    const user = (permissions: { hasFullReadAccess: boolean; hasFullWriteAccess: boolean }) => ({
      loggedIn: true,
      address: "0x1",
      wallets: ["0x1"],
      hasAdminRead: false,
      ...permissions,
    });

    const mountToolsLinks = async () => {
      const wrapper = mount(TheHeader, {
        global: {
          stubs: { RouterLink: RouterLinkStub },
          plugins: [i18n],
        },
      });
      const dropdown = wrapper.findAll(".dropdown-container");
      await fireEvent.click(dropdown[1].find("button")!.element);
      return {
        routerLinks: dropdown[1].findAllComponents(RouterLinkStub).map((link: any) => link.props().to.name),
        hrefs: dropdown[1].findAll("a").map((link) => link.attributes("href")),
      };
    };

    beforeEach(() => {
      (window as any)["##runtimeConfig"] = { appEnvironment: "prividium" };
    });

    afterEach(() => {
      delete (window as any)["##runtimeConfig"];
      userMock.mockReset().mockReturnValue({ loggedIn: false });
    });

    it("shows the API docs and contract verification to users with write access", async () => {
      userMock.mockReturnValue(user({ hasFullReadAccess: true, hasFullWriteAccess: true }));
      const { routerLinks, hrefs } = await mountToolsLinks();
      expect(routerLinks).toContain("contract-verification");
      expect(hrefs).toContain("https://api-url/docs");
    });

    it("shows the API docs but not contract verification to users with read access only", async () => {
      userMock.mockReturnValue(user({ hasFullReadAccess: true, hasFullWriteAccess: false }));
      const { routerLinks, hrefs } = await mountToolsLinks();
      expect(routerLinks).not.toContain("contract-verification");
      expect(hrefs).toContain("https://api-url/docs");
    });

    it("hides the API docs and contract verification from users without full read access", async () => {
      userMock.mockReturnValue(user({ hasFullReadAccess: false, hasFullWriteAccess: false }));
      const { routerLinks, hrefs } = await mountToolsLinks();
      expect(routerLinks).not.toContain("contract-verification");
      expect(hrefs).not.toContain("https://api-url/docs");
    });
  });

  it("hides the documentation link when the docs URL is explicitly hidden", () => {
    (window as any)["##runtimeConfig"] = { links: { docsUrl: "" } };
    const wrapper = mount(TheHeader, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
        plugins: [i18n],
      },
    });
    expect(wrapper.findAll(".navigation-container > .navigation-link")).toHaveLength(0);
    delete (window as any)["##runtimeConfig"];
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
  it("hides a social link when its URL is explicitly hidden", () => {
    (window as any)["##runtimeConfig"] = { links: { discordUrl: "" } };
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });
    const socials = wrapper.findAll(".socials-container > a");
    expect(socials).toHaveLength(1);
    expect(socials[0].attributes("href")).toBe("https://x.com/zksync");
    delete (window as any)["##runtimeConfig"];
  });
  it("hides the socials container when all social URLs are hidden", () => {
    (window as any)["##runtimeConfig"] = { links: { discordUrl: null, xUrl: null } };
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });
    expect(wrapper.find(".socials-container").exists()).toBe(false);
    expect(wrapper.find(".mobile-socials-container").exists()).toBe(false);
    delete (window as any)["##runtimeConfig"];
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
  it("renders hero banner image without cover class by default", async () => {
    const mockNetwork = networkOverridesMock.mockReturnValue({
      heroBannerImageUrl: "https://example.com/banner.webp",
    });
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });

    const heroImage = wrapper.find(".hero-image");
    expect(heroImage.attributes("src")).toBe("https://example.com/banner.webp");
    expect(heroImage.classes()).not.toContain("hero-image-cover");
    mockNetwork.mockRestore();
  });
  it("renders hero banner image with cover class if heroBannerCover is true", async () => {
    const mockNetwork = networkOverridesMock.mockReturnValue({
      heroBannerImageUrl: "https://example.com/banner.webp",
      heroBannerCover: true,
    });
    const wrapper = mount(TheHeader, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n],
      },
    });

    const heroImage = wrapper.find(".hero-image");
    expect(heroImage.attributes("src")).toBe("https://example.com/banner.webp");
    expect(heroImage.classes()).toContain("hero-image-cover");
    mockNetwork.mockRestore();
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
