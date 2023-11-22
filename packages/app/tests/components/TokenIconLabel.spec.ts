import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import { ETH_TOKEN_MOCK } from "../mocks";

import TokenIconLabel from "@/components/TokenIconLabel.vue";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

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
  it("renders token icon if iconUrl is defined", () => {
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: ETH_TOKEN_MOCK.symbol,
        address: ETH_TOKEN_MOCK.l2Address,
        iconUrl: "https://test.link",
      },
    });
    expect(wrapper.find("img")?.attributes("src")).toBe("https://test.link");
  });
  it("renders custom token icon if iconUrl is not defined", () => {
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b",
      },
    });
    expect(wrapper.find("img")?.attributes("src")).toBe("/images/currencies/customToken.svg");
  });
  it("renders token symbol when showLinkSymbol is true", () => {
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
        showLinkSymbol: true,
      },
    });
    expect(wrapper.find(".token-symbol").text()).toBe("ETH");
  });
  it("renders 'unknown' symbol when it is not exist", () => {
    const wrapper = mount(TokenIconLabel, {
      global,
      props: {
        symbol: null,
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
        showLinkSymbol: true,
      },
    });
    expect(wrapper.find(".token-symbol").text()).toBe(i18n.global.t("balances.table.unknownSymbol"));
  });
  it("renders correct link of contract page", () => {
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
  });
  it("renders default 'sm' size for icon", () => {
    const { container } = render(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
      },
    });

    expect(container.querySelector(".sm")).toBeTruthy();
  });
  it("renders 'md' size for icon", () => {
    const { container } = render(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
        iconSize: "md",
      },
    });

    expect(container.querySelector(".md")).toBeTruthy();
  });
  it("renders 'lg' size for icon", () => {
    const { container } = render(TokenIconLabel, {
      global,
      props: {
        symbol: "ETH",
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
        iconSize: "lg",
      },
    });

    expect(container.querySelector(".lg")).toBeTruthy();
  });
});
