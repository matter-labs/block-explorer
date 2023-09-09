import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import { useTokenLibraryMock } from "../mocks";

import TokenIconLabel from "@/components/TokenIconLabel.vue";

import enUS from "@/locales/en.json";

import type { Token } from "@matterlabs/token-library";

import $testId from "@/plugins/testId";
import { ETH_TOKEN } from "@/utils/constants";

describe("TokenIconLabel", () => {
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
  it("renders token icon for verified token", () => {
    const mock = useTokenLibraryMock({
      tokens: computed(() => []),
      getTokens: vi.fn(),
      getToken: () =>
        <Token>{
          ...ETH_TOKEN,
          imageUrl: "https://test.link",
        },
    });
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: ETH_TOKEN.symbol,
        address: ETH_TOKEN.l2Address,
      },
    });
    expect(wrapper.find("img")?.attributes("src")).toBe("https://test.link");
    mock.mockRestore();
  });
  it("renders custom token icon for unverified token", () => {
    const mock = useTokenLibraryMock({
      tokens: computed(() => []),
      getTokens: vi.fn(),
    });
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b",
      },
    });
    expect(wrapper.find("img")?.attributes("src")).toBe("/images/currencies/customToken.svg");
    mock.mockRestore();
  });
  it("hides image when tokens request is pending", () => {
    const mock = useTokenLibraryMock({
      isRequestPending: computed(() => true),
      getTokens: vi.fn(),
    });
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b",
      },
    });
    expect(wrapper.find(".token-img")?.classes().includes("loaded")).toBe(false);
    mock.mockRestore();
  });
  it("renders token symbol when showLinkSymbol is true", () => {
    const mock = useTokenLibraryMock({
      getTokens: vi.fn(),
    });
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
        showLinkSymbol: true,
      },
    });
    expect(wrapper.find(".token-symbol").text()).toBe("ETH");
    mock.mockRestore();
  });
  it("renders 'unknown' symbol when it is not exist", () => {
    const mock = useTokenLibraryMock({
      getTokens: vi.fn(),
    });
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: null,
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
        showLinkSymbol: true,
      },
    });
    expect(wrapper.find(".token-symbol").text()).toBe(i18n.global.t("balances.table.unknownSymbol"));
    mock.mockRestore();
  });
  it("renders custom token icon properly ", () => {
    const mock = useTokenLibraryMock({
      isTokenVerified: computed(() => false),
      getTokens: vi.fn(),
    });
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: "LESA",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
      },
    });
    expect(wrapper.find("img")?.attributes("src")).toBe("/images/currencies/customToken.svg");
    mock.mockRestore();
  });
  it("renders correct link of contract page", () => {
    const mock = useTokenLibraryMock({
      getTokens: vi.fn(),
    });
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
      },
    });
    const contractPageUrl = wrapper.findAllComponents(RouterLinkStub);

    expect(contractPageUrl[0].props().to.name).toBe("address");
    expect(contractPageUrl[0].props().to.params.address).toBe("0xc2675AE7F35b7d85Ed1E828CCf6D0376B01ADea3");
    mock.mockRestore();
  });
  it("renders default 'sm' size for icon", () => {
    const mock = useTokenLibraryMock({
      getTokens: vi.fn(),
    });
    const { container } = render(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
      },
    });

    expect(container.querySelector(".sm")).toBeTruthy();
    mock.mockRestore();
  });
  it("renders 'md' size for icon", () => {
    const mock = useTokenLibraryMock({
      getTokens: vi.fn(),
    });
    const { container } = render(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
        iconSize: "md",
      },
    });

    expect(container.querySelector(".md")).toBeTruthy();
    mock.mockRestore();
  });
  it("renders 'lg' size for icon", () => {
    const mock = useTokenLibraryMock({
      getTokens: vi.fn(),
    });
    const { container } = render(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
        iconSize: "lg",
      },
    });

    expect(container.querySelector(".lg")).toBeTruthy();
    mock.mockRestore();
  });
});
