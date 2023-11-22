import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { render, type RenderResult } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";
import { useTimeAgo } from "@vueuse/core";

import { ETH_TOKEN_MOCK, useContextMock, useTransfersMock } from "./../../mocks";

import Table from "@/components/transfers/Table.vue";

import enUS from "@/locales/en.json";
import elements from "tests/e2e/testId.json";

import $testId from "@/plugins/testId";

vi.mock("vue-router", () => ({
  useRoute: vi.fn(),
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

const transfer = {
  from: "0x0a27CaAeaD54cc6976175F6f4888beB1f871706b",
  to: "0xB2bAbfBBB09A17Fb38cBc7E793B18078dd241347",
  blockNumber: 6681664,
  transactionHash: "0x99e37da46fd7b2913cef0c7a4366dbdc7eea42c42ace71b5c2b276dea74461ba",
  amount: "129187024261081",
  timestamp: "2023-06-01T06:28:16.583Z",
  tokenAddress: "0x0faF6df7054946141266420b43783387A78d82A9",
  type: "transfer",
  fields: null,
  token: {
    l2Address: "0x0faF6df7054946141266420b43783387A78d82A9",
    l1Address: "0xd35CCeEAD182dcee0F148EbaC9447DA2c4D449c4",
    symbol: "USDC",
    name: "USD Coin (goerli)",
    decimals: 6,
    usdPrice: 1,
  },
  fromNetwork: "L1",
  toNetwork: "L1",
};

describe("Transfers:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  let mockContext: SpyInstance;
  let mockTransfers: SpyInstance;

  beforeEach(() => {
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
    mockTransfers?.mockRestore();
  });

  describe("Table:", () => {
    let renderResult: RenderResult | null;

    beforeEach(() => {
      mockTransfers = useTransfersMock({
        data: computed(() => [transfer]),
      });
      renderResult = render(Table, {
        props: {
          address: "0x0a27CaAeaD54cc6976175F6f4888beB1f871706b",
        },
        global: {
          plugins: [i18n, $testId],
          stubs: { RouterLink: RouterLinkStub },
        },
      });
    });

    afterEach(() => {
      renderResult?.unmount();
    });

    it("renders transaction hash column", () => {
      expect(renderResult!.getByTestId(elements.transactionsHash).textContent).toEqual("0x99e37da46fd...61ba");
    });

    it("renders timestamp column", () => {
      expect(renderResult!.getByTestId(elements.timestamp).textContent).toBe(useTimeAgo(transfer.timestamp).value);
    });

    it("renders type column", () => {
      expect(renderResult!.getByTestId(elements.transferType).textContent).toBe(transfer.type);
    });

    it("renders from column", () => {
      expect(renderResult!.getByTestId(elements.fromAddress).textContent).toEqual("0x0a27CaAeaD5...706b");
      expect(renderResult!.getByTestId(elements.transferFromOrigin).textContent).toEqual("L1");
      expect(renderResult!.getByTestId(elements.transferFromOriginTablet).textContent).toEqual("L1");
    });

    it("renders direction column", () => {
      expect(renderResult!.getByTestId(elements.direction).textContent).toEqual("out");
    });

    it("renders to column", () => {
      expect(renderResult!.getByTestId(elements.toAddress).textContent).toEqual("0xB2bAbfBBB09...1347");
      expect(renderResult!.getByTestId(elements.transferToOrigin).textContent).toEqual("L1");
      expect(renderResult!.getByTestId(elements.transferToOriginTablet).textContent).toEqual("L1");
    });

    it("renders from/to column for tablet", () => {
      expect(renderResult?.getByText("0x0a27CaAeaD5...706b", { selector: ".tablet-column a" }));
      expect(renderResult?.getByText("0xB2bAbfBBB09...1347", { selector: ".tablet-column a" }));
    });

    it("renders amount column", () => {
      expect(renderResult!.getByTestId(elements.tokenAmount).textContent).toEqual("129187024.261081");
      expect(renderResult!.getByTestId(elements.tokenAmountPrice).textContent).toEqual("$129.19M");
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
        mockTransfers = useTransfersMock({
          data: computed(() => Array.from({ length: 10 }).map(() => transfer)),
          total: computed(() => 11),
        });
        renderResult = render(Table, {
          props: {
            address: "0x0a27CaAeaD54cc6976175F6f4888beB1f871706b",
          },
          global: {
            plugins: [i18n, $testId],
            stubs: { RouterLink: RouterLinkStub },
          },
        });
      });

      it("renders pagination", async () => {
        expect(renderResult!.container.querySelector(".pagination")).not.toBeNull();
      });
    });

    describe("when total < pageSize", () => {
      let renderResult: RenderResult | null;

      beforeEach(() => {
        mockTransfers = useTransfersMock({
          data: computed(() => [transfer]),
          total: computed(() => 1),
        });
        renderResult = render(Table, {
          props: {
            address: "0x0a27CaAeaD54cc6976175F6f4888beB1f871706b",
          },
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
