import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import NetworkStats from "@/components/NetworkStats.vue";

import enUS from "@/locales/en.json";

const currentNetworkMock = vi.fn(() => "goerli");

vi.mock("@/composables/useContext", () => {
  return {
    default: () => ({
      currentNetwork: computed(() => ({ name: currentNetworkMock() })),
    }),
  };
});

describe("NetworkStats:", () => {
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
    plugins: [i18n],
  };

  it("renders component base on input", () => {
    const { container } = render(NetworkStats, {
      props: {
        loading: false,
        committed: 123,
        verified: 542,
        transactions: 1404,
        totalLocked: 849320,
      },
      global,
    });
    const wrapperArray = container.querySelectorAll(".stats-container");
    expect(wrapperArray[0].textContent).toContain("123");
    expect(wrapperArray[1].textContent).toContain("542");
    expect(wrapperArray[2].textContent).toContain("1 404");
    expect(wrapperArray[3].textContent).toContain("$849,320.0");
  });
  it("renders component without total value locked property", () => {
    const { container } = render(NetworkStats, {
      props: {
        loading: false,
        committed: 123,
        verified: 542,
        transactions: 1404,
      },
      global,
    });
    const wrapperArray = container.querySelectorAll(".stats-container");
    expect(wrapperArray[0].textContent).toContain("123");
    expect(wrapperArray[1].textContent).toContain("542");
    expect(wrapperArray[2].textContent).toContain("1 404");
    expect(wrapperArray[3]).toBe(undefined);
  });
  it("renders loading state", () => {
    const { container } = render(NetworkStats, {
      props: {
        loading: true,
      },
      global,
    });
    expect(container.querySelectorAll(".content-loader").length).toBe(3);
  });
  it("shows 0 if value of committed, verified or transactions is undefined", () => {
    const { container } = render(NetworkStats, {
      props: {
        loading: false,
        committed: undefined,
        verified: undefined,
        transactions: undefined,
      },
      global,
    });
    const wrapperArray = container.querySelectorAll(".stats-container");
    expect(wrapperArray[0].textContent).toContain("0");
    expect(wrapperArray[1].textContent).toContain("0");
    expect(wrapperArray[2].textContent).toContain("0");
  });
  it("renders 'Committed Blocks' link properly", () => {
    const wrapper = mount(NetworkStats, {
      props: {
        loading: false,
        committed: undefined,
        verified: undefined,
        transactions: undefined,
      },
      global,
    });

    expect(wrapper.findAllComponents(RouterLinkStub)[0].props().to.name).toBe("blocks");
  });
  it("renders 'Verified Blocks' link properly", () => {
    const wrapper = mount(NetworkStats, {
      props: {
        loading: false,
        committed: undefined,
        verified: undefined,
        transactions: undefined,
      },
      global,
    });

    expect(wrapper.findAllComponents(RouterLinkStub)[1].props().to.name).toBe("blocks");
  });
  it("renders 'Transactions' link properly", () => {
    const wrapper = mount(NetworkStats, {
      props: {
        loading: false,
        committed: undefined,
        verified: undefined,
        transactions: undefined,
      },
      global,
    });

    expect(wrapper.findAllComponents(RouterLinkStub)[2].props().to.name).toBe("transactions");
  });
  it("renders title", () => {
    const wrapper = mount(NetworkStats, {
      props: {
        loading: false,
      },
      global,
    });

    expect(wrapper.find(".title").text()).toBe("Network Stats");
  });
  it("renders subtitle for testnet", () => {
    const wrapper = mount(NetworkStats, {
      props: {
        loading: false,
      },
      global,
    });

    expect(wrapper.find(".subtitle").text()).toBe("Stats are occasionally reset on testnet.");
  });
  it("renders subtitle for mainnet", () => {
    const mockNetwork = currentNetworkMock.mockReturnValue("mainnet");
    const wrapper = mount(NetworkStats, {
      props: {
        loading: false,
      },
      global,
    });

    expect(wrapper.find(".subtitle").text()).toBe("zkSync Era Mainnet is open to everyone.");
    mockNetwork.mockRestore();
  });
});
