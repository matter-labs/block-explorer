import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import { useWalletMock } from "../mocks";

import ConnectMetaMaskButton from "@/components/ConnectMetamaskButton.vue";

import useContext from "@/composables/useContext";

import enUS from "@/locales/en.json";

// Mock useStorage
vi.mock("@vueuse/core", () => ({
  useStorage: vi.fn(() => computed(() => false)),
}));

// Mock useContext
vi.mock("@/composables/useContext", () => ({
  default: () => ({
    isReady: computed(() => true),
    user: computed(() => ({ loggedIn: false })),
    currentNetwork: computed(() => ({
      name: "test",
      icon: "test",
      apiUrl: "http://test",
      maintenance: false,
      l2NetworkName: "test",
      l2ChainId: 270,
      rpcUrl: "http://test",
      baseTokenAddress: "0x0000000000000000000000000000000000000000",
      prividium: false,
      published: true,
      hostnames: ["test.com"],
    })),
    networks: computed(() => [
      {
        name: "test",
        icon: "test",
        apiUrl: "http://test",
        maintenance: false,
        l2NetworkName: "test",
        l2ChainId: 270,
        rpcUrl: "http://test",
        baseTokenAddress: "0x0000000000000000000000000000000000000000",
        prividium: false,
        published: true,
        hostnames: ["test.com"],
      },
    ]),
    getL2Provider: vi.fn(),
    identifyNetwork: vi.fn(),
  }),
}));

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

    // Mock user as logged in
    vi.mocked(useContext).mockReturnValue({
      isReady: computed(() => true),
      user: computed(() => ({ loggedIn: true, address: "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b" })),
      currentNetwork: computed(() => ({
        name: "test",
        icon: "test",
        apiUrl: "http://test",
        maintenance: false,
        l2NetworkName: "test",
        l2ChainId: 270,
        rpcUrl: "http://test",
        baseTokenAddress: "0x0000000000000000000000000000000000000000",
        prividium: false,
        published: true,
        hostnames: ["test.com"],
      })),
      networks: computed(() => [
        {
          name: "test",
          icon: "test",
          apiUrl: "http://test",
          maintenance: false,
          l2NetworkName: "test",
          l2ChainId: 270,
          rpcUrl: "http://test",
          baseTokenAddress: "0x0000000000000000000000000000000000000000",
          prividium: false,
          published: true,
          hostnames: ["test.com"],
        },
      ]),
      getL2Provider: vi.fn(),
      identifyNetwork: vi.fn(),
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

    // Mock user as logged in
    vi.mocked(useContext).mockReturnValue({
      isReady: computed(() => true),
      user: computed(() => ({ loggedIn: true, address: "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b" })),
      currentNetwork: computed(() => ({
        name: "test",
        icon: "test",
        apiUrl: "http://test",
        maintenance: false,
        l2NetworkName: "test",
        l2ChainId: 270,
        rpcUrl: "http://test",
        baseTokenAddress: "0x0000000000000000000000000000000000000000",
        prividium: false,
        published: true,
        hostnames: ["test.com"],
      })),
      networks: computed(() => [
        {
          name: "test",
          icon: "test",
          apiUrl: "http://test",
          maintenance: false,
          l2NetworkName: "test",
          l2ChainId: 270,
          rpcUrl: "http://test",
          baseTokenAddress: "0x0000000000000000000000000000000000000000",
          prividium: false,
          published: true,
          hostnames: ["test.com"],
        },
      ]),
      getL2Provider: vi.fn(),
      identifyNetwork: vi.fn(),
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
