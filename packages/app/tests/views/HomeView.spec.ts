import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";
import { useTimeAgo } from "@vueuse/core";
import { $fetch } from "ohmyfetch";

import { ETH_TOKEN_MOCK, useBatchesMock } from "../mocks";
import { useTransactionsMock } from "../mocks";

import ExecuteTx from "../../mock/transactions/Execute.json";
import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import HomeView from "@/views/HomeView.vue";

const getBatchesMockCollection = (length: number) =>
  Array.from({ length }).map((_, index) => ({
    rootHash: "0x5a606c1c09d5be2f73c413f27758459a959a642fd3dca2af05d153aac29e229b",
    l1TxCount: 0,
    l2TxCount: 1,
    number: index + 105205,
    status: "sealed",
    timestamp: "2022-04-13T13:09:31.000Z",
  }));

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => ({})),
  };
});

vi.mock("vue-router", () => ({
  useRouter: () => vi.fn(),
  useRoute: () => vi.fn(),
}));

vi.mock("@/composables/useToken", () => {
  return {
    default: () => ({
      getTokenInfo: vi.fn(),
      tokenInfo: computed(() => ETH_TOKEN_MOCK),
      isRequestPending: computed(() => false),
    }),
  };
});

describe("HomeView:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  const global = {
    plugins: [i18n, $testId],
    stubs: ["router-link"],
  };

  it("has correct title", async () => {
    expect(i18n.global.t(routes.find((e) => e.name === "home")?.meta?.title as string)).toBe(
      "Transactions, Blocks, Contracts and much more"
    );
  });

  describe("Batches:", () => {
    it("renders batches properly", () => {
      const mockBatches = useBatchesMock({
        data: ref(getBatchesMockCollection(1)),
      });

      const { container, unmount } = render(HomeView, {
        global,
      });

      const tableHead = container.querySelectorAll(".batches-table .table-head-col");
      expect(tableHead).toHaveLength(4);
      expect(tableHead[0].textContent).toBe("Status");
      expect(tableHead[1].textContent).toBe("Batch");
      expect(tableHead[2].textContent).toBe("Size");
      expect(tableHead[3].textContent).toBe("Age");
      expect(container.querySelector(".time-ago")?.textContent).toBe(useTimeAgo("2022-04-13 16:09").value);
      expect(container.querySelector(".badge-content")?.textContent).toBe("Processed on");

      mockBatches.mockRestore();
      unmount();
    });
    it("renders empty state when batches list is empty", async () => {
      const mockBatches = useBatchesMock({
        data: ref([]),
      });

      const { container, unmount } = render(HomeView, {
        global,
      });

      expect(container.querySelector(".not-found")?.textContent).toBe(
        "We haven't had any batches yet. Please, check again later."
      );
      mockBatches.mockRestore();
      unmount();
    });
    it("renders failed state when request is failed", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockResponse = ($fetch as any).mockRejectedValue(new Error());

      const mockBatches = useBatchesMock({
        data: ref([]),
        failed: ref(true),
      });

      const { container, unmount } = render(HomeView, {
        global,
      });

      expect(container.querySelector(".error-message")?.textContent).toBe(
        "Failed to show .... Please, try to refresh the page."
      );
      mockBatches.mockRestore();
      mockResponse.mockRestore();
      unmount();
    });
  });

  describe("Transactions:", () => {
    it("renders transactions properly", async () => {
      const mockBatches = useBatchesMock({
        data: ref([]),
      });
      const mockTransactions = useTransactionsMock({
        collection: ref([ExecuteTx]),
      });

      const { container, unmount } = render(HomeView, {
        global,
      });

      expect(container.querySelector(".transactions-table")).toBeTruthy();

      mockBatches.mockRestore();
      mockTransactions.mockRestore();
      unmount();
    });
    it("renders empty state when transactions list is empty", async () => {
      const mockBatches = useBatchesMock({
        data: ref(getBatchesMockCollection(1)),
      });
      const mockTransactions = useTransactionsMock({
        collection: ref([]),
      });

      const { container, unmount } = render(HomeView, {
        global,
      });

      expect(container.querySelector(".not-found")?.textContent).toBe(
        "We haven't had any transactions yet. Please, check again later."
      );

      mockBatches.mockRestore();
      mockTransactions.mockRestore();
      unmount();
    });
  });
});
