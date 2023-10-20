import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";
import { $fetch } from "ohmyfetch";

import TransferInfo from "@/components/transactions/infoTable/TransferInfo.vue";

import enUS from "@/locales/en.json";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => ({})),
  };
});

const l1ExplorerUrlMock = vi.fn((): string | null => "https://goerli.etherscan.io");
vi.mock("@/composables/useContext", () => {
  return {
    default: () => ({
      currentNetwork: computed(() => ({ l1ExplorerUrl: l1ExplorerUrlMock() })),
    }),
  };
});

describe("TransferInfo:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  const global = {
    plugins: [i18n],
    stubs: { RouterLink: RouterLinkStub },
  };
  it("renders component properly", async () => {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const mock = ($fetch as any).mockResolvedValue({ accountType: "eOA" });

    const wrapper = mount(TransferInfo, {
      global,
      props: {
        label: "From",
        address: "0x6c10d9c1744f149d4b17660e14faa247964749c7",
        network: "L2",
      },
    });
    expect(wrapper.find("span")?.text()).toBe("From");
    expect(wrapper.findComponent(RouterLinkStub).props().to.name).toBe("address");
    expect(wrapper.findComponent(RouterLinkStub).props().to.params.address).toBe(
      "0x6c10d9C1744F149D4B17660E14FaA247964749c7"
    );
    expect(wrapper.find(".copy-btn")).toBeTruthy();
    expect(wrapper.find(".transactions-data-link-network")?.text()).toBe("L2");

    mock.mockRestore();
    wrapper.unmount();
  });
  it("renders component properly for L1 network", async () => {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const mock = ($fetch as any).mockResolvedValue({ accountType: "eOA" });

    const wrapper = mount(TransferInfo, {
      global,
      props: {
        label: "From",
        address: "0x6c10d9c1744f149d4b17660e14faa247964749c7",
        network: "L1",
      },
    });
    expect(wrapper.find("span")?.text()).toBe("From");
    expect(wrapper.findAll("a")[0].attributes("href")).toEqual(
      "https://goerli.etherscan.io/address/0x6c10d9c1744f149d4b17660e14faa247964749c7"
    );
    expect(wrapper.findAll("a")[0].text()).toEqual("0x6c10d9c1744...49c7");
    expect(wrapper.find(".copy-btn")).toBeTruthy();
    expect(wrapper.find(".transactions-data-link-network")?.text()).toBe("L1");

    mock.mockRestore();
    wrapper.unmount();
  });
  it("renders paymaster label when transaction fee is paid by paymaster", async () => {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const mock = ($fetch as any).mockResolvedValue({ accountType: "eOA" });

    const wrapper = mount(TransferInfo, {
      global,
      props: {
        label: "From",
        address: "0x6c10d9c1744f149d4b17660e14faa247964749c7",
        network: "L2",
        isPaymaster: true,
      },
    });
    expect(wrapper.find(".paymaster-label")?.text()).toBe("Paymaster");

    mock.mockRestore();
    wrapper.unmount();
  });
  describe("when L1 explorer url is not set", () => {
    let mock1ExplorerUrl: Mock;
    beforeEach(() => {
      mock1ExplorerUrl = l1ExplorerUrlMock.mockReturnValue(null);
    });

    afterEach(() => {
      mock1ExplorerUrl.mockRestore();
    });

    it("renders L1 address as text instead of a link", async () => {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const mock = ($fetch as any).mockResolvedValue({ accountType: "eOA" });

      const wrapper = mount(TransferInfo, {
        global,
        props: {
          label: "From",
          address: "0x6c10d9c1744f149d4b17660e14faa247964749c7",
          network: "L1",
        },
      });
      expect(wrapper.find("span")?.text()).toBe("From");
      expect(wrapper.findAll("span.address")[0].text()).toEqual("0x6c10d9c1744...49c7");
      expect(wrapper.find(".copy-btn")).toBeTruthy();
      expect(wrapper.find(".transactions-data-link-network")?.text()).toBe("L1");

      mock.mockRestore();
      wrapper.unmount();
    });
  });
});
