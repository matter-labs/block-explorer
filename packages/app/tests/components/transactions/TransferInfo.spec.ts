import { describe, expect, it, vi } from "vitest";

import { createI18n } from "vue-i18n";

import { mount, RouterLinkStub } from "@vue/test-utils";
import { $fetch } from "ohmyfetch";

import TransferInfo from "@/components/transactions/infoTable/TransferInfo.vue";

import enUS from "@/locales/en.json";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => ({})),
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
});
