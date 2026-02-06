import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";
import { useTimeAgo } from "@vueuse/core";
import { $fetch } from "ohmyfetch";

import { ETH_TOKEN_MOCK, useBlocksMock } from "../mocks";
import { useTransactionsMock } from "../mocks";

import ExecuteTx from "../../mock/transactions/Execute.json";
import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import HomeView from "@/views/HomeView.vue";

const getBlocksMockCollection = (length: number) =>
  Array.from({ length }).map((_, index) => ({
    hash: "0x5a606c1c09d5be2f73c413f27758459a959a642fd3dca2af05d153aac29e229b",
    number: index + 105205,
    status: "sealed",
    timestamp: "2022-04-13T13:09:31.000Z",
  }));
const routeQueryMock = vi.fn(() => ({}));

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => ({})),
  };
});

vi.mock("vue-router", () => ({
  useRouter: () => vi.fn(),
  useRoute: () => ({
    query: routeQueryMock(),
  }),
  createWebHistory: () => vi.fn(),
  createRouter: () => ({ beforeEach: vi.fn() }),
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

  describe("Blocks:", () => {
    it("renders blocks properly", () => {
      const mockBlocks = useBlocksMock({
        data: ref(getBlocksMockCollection(1)),
      });

      const { container, unmount } = render(HomeView, {
        global,
      });

      const tableHead = container.querySelectorAll(".blocks-table .table-head-col");
      expect(tableHead).toHaveLength(3);
      expect(tableHead[0].textContent).toBe("Block");
      expect(tableHead[1].textContent).toBe("Status");
      expect(tableHead[2].textContent).toBe("Age");
      expect(container.querySelector(".time-ago")?.textContent).toBe(useTimeAgo("2022-04-13 16:09").value);

      mockBlocks.mockRestore();
      unmount();
    });
    it("renders empty state when block list is empty", async () => {
      const mockBlocks = useBlocksMock({
        data: ref([]),
      });

      const { container, unmount } = render(HomeView, {
        global,
      });

      expect(container.querySelector(".not-found")?.textContent).toBe(
        "We haven't had any blocks yet. Please, check again later."
      );
      mockBlocks.mockRestore();
      unmount();
    });
    it("renders failed state when request is failed", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockResponse = ($fetch as any).mockRejectedValue(new Error());

      const mockBlocks = useBlocksMock({
        data: ref([]),
        failed: ref(true),
      });

      const { container, unmount } = render(HomeView, {
        global,
      });

      expect(container.querySelector(".error-message")?.textContent).toBe(
        "Failed to show .... Please, try to refresh the page."
      );
      mockBlocks.mockRestore();
      mockResponse.mockRestore();
      unmount();
    });
  });

  describe("Transactions:", () => {
    it("renders transactions properly", async () => {
      const mockBlocks = useBlocksMock({
        data: ref([]),
      });
      const mockTransactions = useTransactionsMock({
        collection: ref([ExecuteTx]),
      });

      const { container, unmount } = render(HomeView, {
        global,
      });

      expect(container.querySelector(".transactions-table")).toBeTruthy();

      mockBlocks.mockRestore();
      mockTransactions.mockRestore();
      unmount();
    });
    it("renders empty state when transactions list is empty", async () => {
      const mockBlocks = useBlocksMock({
        data: ref(getBlocksMockCollection(1)),
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

      mockBlocks.mockRestore();
      mockTransactions.mockRestore();
      unmount();
    });
  });
});
