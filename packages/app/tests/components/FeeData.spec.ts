import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { fireEvent, render } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import { ETH_TOKEN_MOCK } from "../mocks";

import { default as FeeDataComponent } from "@/components/FeeData.vue";

import enUS from "@/locales/en.json";

import type { FeeData } from "@/composables/useTransaction";

import $testId from "@/plugins/testId";

vi.mock("@/composables/useToken", () => {
  return {
    default: () => ({
      getTokenInfo: () => undefined,
      tokenInfo: computed(() => ({
        l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
        usdPrice: 150,
      })),
    }),
  };
});

const i18n = createI18n({
  locale: "en",
  allowComposition: true,
  messages: {
    en: enUS,
  },
});

const feeData = {
  amountPaid: "10000000000000000",
  isPaidByPaymaster: false,
  refunds: [
    {
      tokenInfo: {
        decimals: 18,
        l1Address: "0x0000000000000000000000000000000000000000",
        l2Address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        name: "Ether",
        usdPrice: 3500,
      },
      amount: "1000000",
      from: "0x0000000000000000000000000000000000008001",
      to: "0x9adEe6D82c003FF2E0F2026A13ae80736CA61163",
      type: "transfer",
      fromNetwork: "L2",
      toNetwork: "L2",
    },
  ],
  amountRefunded: "1000000",
};

const feeDataPaymaster = {
  ...feeData,
  isPaidByPaymaster: true,
  paymasterAddress: "0x9adEe6D82c003FF2E0F2026A13ae80736CA61163",
};

const global = {
  stubs: {
    RouterLink: RouterLinkStub,
  },
  plugins: [$testId, i18n],
};

describe("FeeToken", () => {
  it("renders amount and token correctly", async () => {
    const wrapper = mount(FeeDataComponent, {
      global,
      props: {
        feeData: feeData as FeeData,
        showDetails: false,
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".token-amount").text()).toBe("0.01");
    expect(wrapper.find(".token-symbol").text()).toBe(ETH_TOKEN_MOCK.symbol);
    expect(wrapper.find(".token-price").text()).toBe("$1.50");
  });
  it("handles amount update correctly", async () => {
    const wrapper = mount(FeeDataComponent, {
      global,
      props: {
        feeData: feeData as FeeData,
      },
    });
    expect(wrapper.find(".token-amount").text()).toBe("0.01");
    await wrapper.setProps({
      feeData: feeData as FeeData,
    });
    expect(wrapper.find(".token-amount").text()).toBe("0.01");
  });

  it("does not display fee details button when showDetails is falsy", async () => {
    const wrapper = mount(FeeDataComponent, {
      global,
      props: {
        showDetails: false,
        feeData: feeData as FeeData,
      },
    });

    expect(wrapper.find(".toggle-button").exists()).toBe(false);
  });

  it("displays the initial fee details when expanded", async () => {
    const { container } = render(FeeDataComponent, {
      global,
      props: {
        feeData: feeData as FeeData,
      },
    });

    await fireEvent.click(container.querySelector(".toggle-button")!);
    expect(container.querySelector(".details-data-container .details-title")?.textContent).toBe("Initial:");
    expect(container.querySelector(".details-data-container .token-amount")?.textContent).toBe("0.010000000001");
  });

  it("displays the refunds details when expanded", async () => {
    const { container } = render(FeeDataComponent, {
      global,
      props: {
        feeData: feeData as FeeData,
      },
    });

    await fireEvent.click(container.querySelector(".toggle-button")!);
    expect(container.querySelector(".details-data-container:nth-child(2) .details-title")?.textContent).toBe(
      "Refunded:"
    );
    expect(container.querySelector(".details-data-container:nth-child(2) .token-amount")?.textContent).toBe(
      "0.000000000001"
    );
  });

  describe("when transaction fee is not paid by paymaster", () => {
    it("does not display paid by paymaster label when fee is not paid by paymaster", async () => {
      const { container } = render(FeeDataComponent, {
        global,
        props: {
          feeData: feeData as FeeData,
        },
      });
      expect(container.querySelector(".payed-by-paymaster-label")).toBe(null);
    });

    it("displays the refunds when expanded", async () => {
      const { container } = render(FeeDataComponent, {
        global,
        props: {
          feeData: feeData as FeeData,
        },
      });

      await fireEvent.click(container.querySelector(".toggle-button")!);
      const transfers = container.querySelectorAll(".fee-transfers-container .transfer-container");
      expect(transfers.length).toBe(1);
      const transferInfo = transfers[0].querySelectorAll(".transfer-info-container");
      expect(transferInfo[0].querySelector(".address span")?.textContent).toBe("0x00000000000...8001");
      expect(transferInfo[0].querySelector(".paymaster-label")).toBe(null);
      expect(transferInfo[1].querySelector(".address span")?.textContent).toBe("0x9adEe6D82c0...1163");
      expect(transferInfo[1].querySelector(".paymaster-label")).toBe(null);
      expect(container.querySelectorAll(".transfer-amount-container span")[0]?.textContent).toBe("for");
      expect(container.querySelectorAll(".transfer-amount-container span")[1]?.textContent).toBe("0.000000000001");
      expect(container.querySelectorAll(".transfer-amount-container span")[2]?.textContent).toBe("ETH");
    });

    it("displays the 'Why Refunded?' link when expanded", async () => {
      const { container } = render(FeeDataComponent, {
        global,
        props: {
          feeData: feeData as FeeData,
        },
      });

      await fireEvent.click(container.querySelector(".toggle-button")!);
      const link = container.querySelector(".refunded-link");
      expect(link?.getAttribute("href")).toBe(
        "https://docs.zksync.io/build/developer-reference/fee-model.html#refunds"
      );
      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.textContent).toBe("Why am I being refunded?");
    });
  });

  describe("when transaction fee is paid by paymaster", () => {
    it("display paid by paymaster label when fee is paid by paymaster", async () => {
      const { container } = render(FeeDataComponent, {
        global,
        props: {
          feeData: feeDataPaymaster as FeeData,
        },
      });
      expect(container.querySelector(".payed-by-paymaster-label")?.textContent).toBe("Paid by Paymaster");
    });

    it("displays the refunds when expanded", async () => {
      const { container } = render(FeeDataComponent, {
        global,
        props: {
          feeData: feeDataPaymaster as FeeData,
        },
      });

      await fireEvent.click(container.querySelector(".toggle-button")!);
      const transfers = container.querySelectorAll(".fee-transfers-container .transfer-container");
      expect(transfers.length).toBe(1);
      const transferInfo = transfers[0].querySelectorAll(".transfer-info-container");
      expect(transferInfo[0].querySelector(".address span")?.textContent).toBe("0x00000000000...8001");
      expect(transferInfo[0].querySelector(".paymaster-label")).toBe(null);
      expect(transferInfo[1].querySelector(".address span")?.textContent).toBe("0x9adEe6D82c0...1163");
      expect(transferInfo[1].querySelector(".paymaster-label")?.textContent).toBe("Paymaster");
      expect(container.querySelectorAll(".transfer-amount-container span")[0]?.textContent).toBe("for");
      expect(container.querySelectorAll(".transfer-amount-container span")[1]?.textContent).toBe("0.000000000001");
      expect(container.querySelectorAll(".transfer-amount-container span")[2]?.textContent).toBe("ETH");
    });

    it("displays the 'Why Paymaster Refunded?' and 'What is Paymaster' links when expanded", async () => {
      const { container } = render(FeeDataComponent, {
        global,
        props: {
          feeData: feeDataPaymaster as FeeData,
        },
      });

      await fireEvent.click(container.querySelector(".toggle-button")!);

      const refundedLink = container.querySelector(".refunded-link");
      expect(refundedLink?.getAttribute("href")).toBe(
        "https://docs.zksync.io/build/developer-reference/fee-model.html#refunds"
      );
      expect(refundedLink?.getAttribute("target")).toBe("_blank");
      expect(refundedLink?.textContent).toBe("Why is Paymaster being refunded?");

      const paymasterLink = container.querySelector(".paymaster-link");
      expect(paymasterLink?.getAttribute("href")).toBe(
        "https://docs.zksync.io/build/developer-reference/account-abstraction.html#paymasters"
      );
      expect(paymasterLink?.getAttribute("target")).toBe("_blank");
      expect(paymasterLink?.textContent).toBe("What is Paymaster?");
    });
  });
});
