import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import MaintenanceView from "@/views/MaintenanceView.vue";

vi.mock("@/composables/useContext", () => {
  return {
    default: () => ({
      currentNetwork: computed(() => ({ l2NetworkName: "Mainnet" })),
    }),
  };
});
describe("MaintenanceView:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders correct network name", async () => {
    const wrapper = mount(MaintenanceView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });
    wrapper.unmount();

    expect(wrapper.find(`.title`).text()).toBe(i18n.global.t("maintenance.title", { network: "Mainnet" }));
    expect(wrapper.find(`.description`).text().includes("Mainnet")).toBe(true);
  });
  it("renders twitter and uptime links", async () => {
    const wrapper = mount(MaintenanceView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.findAll(`.description a`)[0].attributes("href")).toBe("https://twitter.com/zkSyncDevs");
    expect(wrapper.findAll(`.description a`)[1].attributes("href")).toBe("https://uptime.com/s/zkSync-testnet");
    expect(wrapper.find(`.twitter-button`).attributes("href")).toBe("https://twitter.com/zkSyncDevs");
    expect(wrapper.find(`.uptime-link`).attributes("href")).toBe("https://uptime.com/s/zkSync-testnet");
  });
});
