import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { render, type RenderResult } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";

import { ETH_TOKEN_MOCK, useContextMock, useTransactionsMock } from "../../mocks";

import Table from "@/components/transactions/Table.vue";

import enUS from "@/locales/en.json";
import elements from "tests/e2e/testId.json";

import type { AbiFragment } from "@/composables/useAddress";
import type { TransactionListItem } from "@/composables/useTransactions";

import $testId from "@/plugins/testId";

vi.mock("vue-router", () => ({
  useRoute: vi.fn(() => ({ query: {} })),
}));
vi.mock("@/composables/useTokenLibrary", () => {
  return {
    default: () => ({
      getToken: (address: string) =>
        address === ETH_TOKEN_MOCK.l2Address
          ? {
              ...ETH_TOKEN_MOCK,
              iconURL: "https://test.link",
            }
          : null,
      getTokens: () => undefined,
      isRequestFailed: computed(() => false),
      isRequestPending: computed(() => false),
    }),
  };
});

const transaction: TransactionListItem = {
  hash: "0x20e564c3178e1f059c8ac391f35dd73c20ac4a4731b23fa7e436b3d221676ff6",
  to: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
  from: "0xb942802a389d23fCc0a807d4aa85e956dcF20f5B",
  data: "0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000648656c6c6f210000000000000000000000000000000000000000000000000000",
  value: "12321312300000",
  isL1Originated: false,
  fee: "0x3b9329f2a880",
  nonce: 69,
  blockNumber: 6539779,
  l1BatchNumber: 74373,
  blockHash: "0x5ad6b0475a6bdff6007e62adec0ceed0796fb427fe8f4de310432a52e118800b",
  transactionIndex: 5,
  receivedAt: "2023-06-20T12:10:44.187Z",
  status: "included",
  commitTxHash: null,
  executeTxHash: null,
  proveTxHash: null,
  isL1BatchSealed: false,
  gasPrice: "4000",
  gasLimit: "5000",
  gasUsed: "3000",
  gasPerPubdata: "800",
  maxFeePerGas: "7000",
  maxPriorityFeePerGas: "8000",
  error: null,
  revertReason: null,
};

const contractAbi: AbiFragment[] = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_greeting",
        type: "string",
      },
    ],
    name: "setGreeting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

describe("Transfers:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  let mockContext: SpyInstance;
  let mockTransactions: SpyInstance;

  beforeEach(() => {
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
    mockTransactions?.mockRestore();
  });

  describe("Table:", () => {
    let renderResult: RenderResult | null;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-06-21T10:00:00.000Z"));
      mockTransactions = useTransactionsMock({
        data: computed(() => [transaction]),
      });
      renderResult = render(Table, {
        props: {},
        global: {
          plugins: [i18n, $testId],
          stubs: { RouterLink: RouterLinkStub },
        },
      });
    });

    afterEach(() => {
      renderResult?.unmount();
      vi.useRealTimers();
    });

    describe("when transaction status is committed", () => {
      let renderResult: RenderResult | null;

      beforeEach(() => {
        mockTransactions = useTransactionsMock({
          data: computed(() => [{ ...transaction, status: "committed" }]),
        });
        renderResult = render(Table, {
          props: {},
          global: {
            plugins: [i18n, $testId],
            stubs: { RouterLink: RouterLinkStub },
          },
        });
      });

      afterEach(() => {
        renderResult!.unmount();
      });

      it("renders sent status column", () => {
        expect(renderResult!.container.querySelector(".badge-content")!.textContent).toEqual("Sent on");
      });
    });

    describe("when transaction status is proved", () => {
      let renderResult: RenderResult | null;

      beforeEach(() => {
        mockTransactions = useTransactionsMock({
          data: computed(() => [{ ...transaction, status: "proved" }]),
        });
        renderResult = render(Table, {
          props: {},
          global: {
            plugins: [i18n, $testId],
            stubs: { RouterLink: RouterLinkStub },
          },
        });
      });

      afterEach(() => {
        renderResult!.unmount();
      });

      it("renders validated status column", () => {
        expect(renderResult!.container.querySelector(".badge-content")!.textContent).toEqual("Validated on");
      });
    });

    describe("when transaction status is verified", () => {
      let renderResult: RenderResult | null;

      beforeEach(() => {
        mockTransactions = useTransactionsMock({
          data: computed(() => [{ ...transaction, status: "verified" }]),
        });
        renderResult = render(Table, {
          props: {},
          global: {
            plugins: [i18n, $testId],
            stubs: { RouterLink: RouterLinkStub },
          },
        });
      });

      afterEach(() => {
        renderResult!.unmount();
      });

      it("renders executed status column", () => {
        expect(renderResult!.container.querySelector(".badge-content")!.textContent).toEqual("Executed on");
      });
    });

    it("renders status column", () => {
      expect(renderResult!.getByTestId(elements.statusBadge).textContent).toEqual("Processed on");
    });

    it("renders transaction hash column", () => {
      expect(renderResult!.getByTestId(elements.transactionsHash).textContent).toEqual("0x20e564c...6ff6");
    });

    it("renders method name column", () => {
      expect(renderResult!.getByTestId(elements.transactionsMethodName).textContent).toEqual("0xa4136862");
    });

    it("renders decoded method name when ABI is passed", async () => {
      await renderResult?.rerender({ contractAbi });
      expect(renderResult!.getByTestId(elements.transactionsMethodName).textContent).toEqual("setGreeting");
    });

    it("renders timestamp column", () => {
      expect(renderResult!.getByTestId(elements.timestamp).textContent).toBe("yesterday");
    });

    it("renders from column", () => {
      expect(renderResult!.getAllByTestId(elements.fromAddress)[0].textContent).toEqual("0xb9428...0f5B");
    });

    it("renders direction column", () => {
      expect(renderResult!.getByTestId(elements.direction).textContent).toEqual("out");
    });

    it("renders to column", () => {
      expect(renderResult!.getAllByTestId(elements.toAddress)[0].textContent).toEqual("0x3355d...aaf4");
    });

    it("renders from/to column for tablet", () => {
      expect(renderResult?.getByText("0xb9428...0f5B", { selector: ".tablet-column a" }));
      expect(renderResult?.getByText("0x3355d...aaf4", { selector: ".tablet-column a" }));
    });

    it("renders value column", () => {
      expect(renderResult!.getAllByTestId(elements.tokenAmount)[0].textContent).toEqual("0.0000123213123");
      expect(renderResult!.getAllByTestId(elements.tokenAmountPrice)[0].textContent).toEqual("$0.02");
    });

    it("renders fee column", () => {
      expect(renderResult!.getAllByTestId(elements.tokenAmount)[2].textContent).toEqual("0.00006550325");
      expect(renderResult!.getAllByTestId(elements.tokenAmountPrice)[1].textContent).toEqual("$0.12");
    });
  });

  describe("Table with pagination:", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-06-02T10:00:00.000Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    describe("when total > pageSize", () => {
      let renderResult: RenderResult | null;

      beforeEach(() => {
        mockTransactions = useTransactionsMock({
          data: computed(() => Array.from({ length: 10 }).map(() => transaction)),
          total: computed(() => 11),
        });
        renderResult = render(Table, {
          props: {},
          global: {
            plugins: [i18n, $testId],
            stubs: { RouterLink: RouterLinkStub },
          },
        });
      });

      it("renders pagination", async () => {
        expect(renderResult!.container.querySelector(".pagination")).not.toBeNull();
      });

      it("does not render pagination if pagination prop is false", async () => {
        await renderResult?.rerender({ pagination: false });
        expect(renderResult!.container.querySelector(".pagination")).toBeNull();
      });
    });

    describe("when total < pageSize", () => {
      let renderResult: RenderResult | null;

      beforeEach(() => {
        mockTransactions = useTransactionsMock({
          data: computed(() => [transaction]),
          total: computed(() => 1),
        });
        renderResult = render(Table, {
          props: {},
          global: {
            plugins: [i18n, $testId],
            stubs: { RouterLink: RouterLinkStub },
          },
        });
      });

      it("does not render pagination", async () => {
        expect(renderResult!.container.querySelector(".pagination")).toBeNull();
      });
    });
  });
});
