import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import { useWalletMock } from "../mocks";

import ConnectMetaMaskButton from "@/components/ConnectMetamaskButton.vue";

import enUS from "@/locales/en.json";

describe("ConnectMetaMaskButton:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("shows default state when wallet isn't connected", async () => {
    const mock = useWalletMock({
      isReady: computed(() => true),
      isMetamaskInstalled: computed(() => true),
    });
    const wrapper = mount(ConnectMetaMaskButton, {
      global: {
        plugins: [i18n],
      },
    });

    const connectButton = wrapper.find(".login-button");
    expect(connectButton.text()).toBe(i18n.global.t("connectMetamaskButton.label"));
    expect(connectButton.attributes("disabled")).toBe(undefined);
    mock.mockRestore();
  });
  it("shows connecting state when connection is pending", async () => {
    const mock = useWalletMock({
      isConnectPending: computed(() => true),
    });

    const wrapper = mount(ConnectMetaMaskButton, {
      global: {
        plugins: [i18n],
      },
    });

    const connectButton = wrapper.find(".login-button");
    expect(connectButton.text()).toBe(i18n.global.t("connectMetamaskButton.connecting"));
    expect(connectButton.attributes("disabled")).toBe("");
    mock.mockRestore();
  });
  it("shows address when wallet is connected", async () => {
    const mock = useWalletMock({
      address: computed(() => "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b"),
    });

    const wrapper = mount(ConnectMetaMaskButton, {
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find(".address-text").text()).toBe("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b");
    mock.mockRestore();
  });
  it("connects when button is clicked", async () => {
    const mockConnect = vi.fn();
    const mock = useWalletMock({
      isReady: computed(() => true),
      isMetamaskInstalled: computed(() => true),
      connect: mockConnect,
    });

    const wrapper = mount(ConnectMetaMaskButton, {
      global: {
        plugins: [i18n],
      },
    });

    await wrapper.find(".login-button").trigger("click");
    expect(mockConnect).toHaveBeenCalledOnce();
    mock.mockRestore();
  });
  it("disconnects when logout button is clicked", async () => {
    const mockDisconnect = vi.fn();
    const mock = useWalletMock({
      address: computed(() => "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b"),
      disconnect: mockDisconnect,
    });

    const wrapper = mount(ConnectMetaMaskButton, {
      global: {
        plugins: [i18n],
      },
    });

    await wrapper.find(".dropdown-button").trigger("click");
    await wrapper.find(".logout-button").trigger("click");
    expect(mockDisconnect).toHaveBeenCalledOnce();
    mock.mockRestore();
  });
});
