import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { fireEvent, render } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import { useContractInteractionMock } from "../../../mocks";

import FunctionDropdown from "@/components/contract/interaction/FunctionDropdown.vue";

import enUS from "@/locales/en.json";

import type { AbiFragment } from "@/composables/useAddress";

const abiFragment: AbiFragment = {
  inputs: [{ internalType: "address", name: "spender", type: "address" }],
  name: "decreaseAllowance",
  outputs: [{ internalType: "bool", name: "", type: "bool" }],
  stateMutability: "nonpayable",
  type: "function",
};

describe("FunctionDropdown", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  const global = {
    plugins: [i18n],
    stubs: {
      RouterLink: RouterLinkStub,
    },
  };
  it("renders default slot", async () => {
    const { getByText, unmount } = render(FunctionDropdown, {
      global,
      slots: {
        default: "Test",
      },
      props: {
        type: "read",
        abiFragment,
      },
    });
    expect(getByText("Test"));
    unmount();
  });
  it("renders response message", async () => {
    const mock = useContractInteractionMock({
      response: computed(() => ({ message: "Test response" })),
    });
    const { container, getByText, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "read",
        abiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    expect(getByText("Test response"));
    unmount();
    mock.mockRestore();
  });
  it("renders response transactionHash", async () => {
    const mock = useContractInteractionMock({
      response: computed(() => ({
        transactionHash: "0xfb905312c08c369d2a09860e0268605e08fa409ae11db86050745d67593f04de",
      })),
    });
    const wrapper = mount(FunctionDropdown, {
      global,
      props: {
        type: "write",
        abiFragment,
      },
    });
    await wrapper.find(".function-disclosure-btn").trigger("click");
    expect(wrapper.findComponent(RouterLinkStub).props().to.name).toBe("transaction");
    expect(wrapper.findComponent(RouterLinkStub).props().to.params.hash).toBe(
      "0xfb905312c08c369d2a09860e0268605e08fa409ae11db86050745d67593f04de"
    );

    wrapper.unmount();
    mock.mockRestore();
  });
  it("renders empty response message", async () => {
    const mock = useContractInteractionMock({
      response: computed(() => ({ message: "" })),
    });
    const { container, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "read",
        abiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    expect(container.querySelector(".response-message")?.textContent).toBe("");
    unmount();
    mock.mockRestore();
  });
  it("renders connect wallet button when wallet is not connected", async () => {
    const mock = useContractInteractionMock({
      isMetamaskInstalled: computed(() => true),
      isWalletConnected: computed(() => false),
    });
    const { container, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "write",
        abiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    expect(container.querySelector(".connect-wallet-button")).toBeTruthy();
    unmount();
    mock.mockRestore();
  });
  it("doesn't render error message for read method when meta mask is not installed", async () => {
    const mock = useContractInteractionMock({
      isMetamaskInstalled: computed(() => false),
    });
    const { container, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "read",
        abiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    expect(container.querySelector(".wallet-not-found-error")).toBeFalsy();
    unmount();
    mock.mockRestore();
  });
  it("renders error message when meta mask is not installed", async () => {
    const mock = useContractInteractionMock({
      isMetamaskInstalled: computed(() => false),
    });
    const { container, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "write",
        abiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    expect(container.querySelector(".wallet-not-found-error")).toBeTruthy();
    unmount();
    mock.mockRestore();
  });
  it("renders error message when interaction failed", async () => {
    const mock = useContractInteractionMock({
      errorMessage: computed(() => "Test error message"),
    });
    const { container, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "write",
        abiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    expect(container.querySelector(".error-message")?.textContent).toBe("Test error message");
    unmount();
    mock.mockRestore();
  });
  it("shows login button when user is not logged in", async () => {
    const mock = useContractInteractionMock({
      isMetamaskInstalled: computed(() => true),
      isWalletConnected: computed(() => false),
    });
    const { container, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "write",
        abiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    expect(container.querySelector(".connect-wallet-button")).toBeTruthy();
    unmount();
    mock.mockRestore();
  });
  it("submit button and inputs are disabled when request is pending", async () => {
    const mock = useContractInteractionMock({
      isRequestPending: computed(() => true),
      isWalletConnected: computed(() => true),
    });
    const { container, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "write",
        abiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    expect(container.querySelector("form button[type='submit']")?.getAttribute("disabled")).toBe("");
    expect(container.querySelector("form input")?.getAttribute("disabled")).toBe("");
    unmount();
    mock.mockRestore();
  });
  it("writeFunction is called when submit button is clicked", async () => {
    const writeFunctionMock = vi.fn();
    const mock = useContractInteractionMock({
      isWalletConnected: computed(() => true),
      writeFunction: writeFunctionMock,
    });
    const noInputsAbiFragment = {
      ...abiFragment,
      inputs: [],
    };
    const { container, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "write",
        contractAddress: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
        abiFragment: noInputsAbiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    await fireEvent.click(container.querySelector("form button[type='submit']")!);
    await new Promise((resolve) => setImmediate(resolve));
    expect(writeFunctionMock).toHaveBeenCalledWith(
      "0x4732c03b2cf6ede46500e799de79a15df44929eb",
      noInputsAbiFragment,
      {}
    );
    unmount();
    mock.mockRestore();
  });
  it("readFunction is called when submit button is clicked", async () => {
    const readFunctionMock = vi.fn();
    const mock = useContractInteractionMock({
      readFunction: readFunctionMock,
    });
    const noInputsAbiFragment = {
      ...abiFragment,
      inputs: [],
    };
    const { container, unmount } = render(FunctionDropdown, {
      global,
      props: {
        type: "read",
        contractAddress: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
        abiFragment: noInputsAbiFragment,
      },
    });
    await fireEvent.click(container.querySelector(".function-disclosure-btn")!);
    await fireEvent.click(container.querySelector("form button[type='submit']")!);
    await new Promise((resolve) => setImmediate(resolve));
    expect(readFunctionMock).toHaveBeenCalledWith(
      "0x4732c03b2cf6ede46500e799de79a15df44929eb",
      noInputsAbiFragment,
      {}
    );
    unmount();
    mock.mockRestore();
  });
});
