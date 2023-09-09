import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { fireEvent, render } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";

import TransactionDataComponent from "@/components/transactions/infoTable/TransactionData.vue";

import enUS from "@/locales/en.json";

import type { TransactionData } from "@/composables/useTransactionData";

import $testId from "@/plugins/testId";

const transactionData = {
  contractAddress: "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b",
  calldata:
    "0xa9059cbb000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f0440000000000000000000000000000000000000000000000000000000000000001",
  value: "0x0",
  sighash: "0xa9059cbb",
  factoryDeps: null,
} as TransactionData;
const transactionDataDecodedMethod = {
  name: "transfer",
  inputs: [
    {
      name: "recipient",
      type: "address",
      value: "0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044",
      encodedValue: "000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f044",
    },
    {
      name: "amount",
      type: "uint256",
      value: "1",
      encodedValue: "0000000000000000000000000000000000000000000000000000000000000001",
    },
  ],
} as TransactionData["method"];

const router = {
  push: vi.fn(),
};

vi.mock("vue-router", () => ({
  useRouter: () => router,
}));

describe("TransactionDataComponent", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders decoded data by default", () => {
    const { container } = render(TransactionDataComponent, {
      props: {
        data: { ...transactionData, method: transactionDataDecodedMethod },
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    expect(container.querySelector(".toggle-decode-button")?.textContent).toBe(
      i18n.global.t("transactionData.showOriginalInput")
    );
    expect(container.querySelector(".method-interface")?.textContent).toBe(
      "Function: transfer(address recipient, uint256 amount)"
    );
    expect(container.querySelector(".show-as-dropdown")?.textContent).toBe(
      i18n.global.t("transactionData.viewOptions.decoded")
    );
    const parameterRows = container.querySelectorAll(".method-parameters-table tbody tr");
    const [row1Columns, row2Columns] = Array.from(parameterRows).map((row) =>
      Array.from(row.querySelectorAll("td")).map((column) => column.textContent)
    );
    expect(row1Columns).toEqual(["0", "recipient", "address", "0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044"]);
    expect(row2Columns).toEqual(["1", "amount", "uint256", "1"]);
  });
  it("renders binary decoded data when selected in the dropdown", async () => {
    const { container } = render(TransactionDataComponent, {
      props: {
        data: { ...transactionData, method: transactionDataDecodedMethod },
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await fireEvent.click(container.querySelector(".show-as-dropdown .toggle-button")!);
    await fireEvent.click(container.querySelectorAll(".options-list-item")[1]);
    expect(container.querySelector(".show-as-dropdown")?.textContent).toBe(
      i18n.global.t("transactionData.viewOptions.original")
    );
    expect(container.querySelector(".encoded-data-container")?.textContent).toBe(
      "MethodID: 0xa9059cbb[0]: 000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f044[1]: 0000000000000000000000000000000000000000000000000000000000000001"
    );
  });
  it("renders original data by default if contract is not verified", async () => {
    const { container } = render(TransactionDataComponent, {
      props: {
        data: transactionData,
        error: "contract_not_verified",
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    expect(container.querySelector(".transaction-byte-data")?.textContent).toBe(
      "0xa9059cbb000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f0440000000000000000000000000000000000000000000000000000000000000001"
    );
    expect(container.querySelector(".decoding-data-error")?.textContent).toBe(
      i18n.global.t("transactionData.errors.unableToDecode", {
        error: i18n.global.t("transactionData.errors.contract_not_verified"),
      })
    );
  });
  it("renders empty data without error and decode button", async () => {
    const { container } = render(TransactionDataComponent, {
      props: {
        data: { ...transactionData, calldata: "0x" },
        error: "",
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    expect(container.querySelector(".transaction-byte-data")?.textContent).toBe("0x");
    expect(container.querySelector(".decoding-data-error")).toBeNull();
    expect(container.querySelector(".toggle-decode-button")).toBeNull();
  });
  it("doesn't render decode button if contract is not verified", () => {
    const { container } = render(TransactionDataComponent, {
      props: {
        data: transactionData,
        error: "contract_not_verified",
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    expect(container.querySelector(".toggle-decode-button")).toBeNull();
  });
  it("renders custom error correctly", async () => {
    const { container } = render(TransactionDataComponent, {
      props: {
        data: transactionData,
        error: "Custom error message",
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    expect(container.querySelector(".decoding-data-error")?.textContent).toBe(
      i18n.global.t("transactionData.errors.unableToDecode", {
        error: "Custom error message",
      })
    );
  });
  it("renders loading", async () => {
    const { container } = render(TransactionDataComponent, {
      props: {
        data: transactionData,
        loading: true,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await fireEvent.click(container.querySelector(".toggle-decode-button")!);
    expect(container.querySelector(".decoding-loading")?.textContent).toBe(
      i18n.global.t("transactionData.decodingInProgress")
    );
  });
  it("toggles decoded / original data correctly", async () => {
    const { container } = render(TransactionDataComponent, {
      props: {
        data: { ...transactionData, method: transactionDataDecodedMethod },
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    expect(container.querySelector(".transaction-byte-data")).toBeFalsy();
    await fireEvent.click(container.querySelector(".toggle-decode-button")!);
    expect(container.querySelector(".method-interface")).toBeFalsy();
    expect(container.querySelector(".show-as-dropdown")).toBeFalsy();
    expect(container.querySelector(".method-parameters-table")).toBeFalsy();
  });
});
