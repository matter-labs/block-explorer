import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";

import Token from "@/components/Token.vue";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

const router = {
  replace: vi.fn(),
  currentRoute: {
    value: {},
  },
};
const routeQueryMock = vi.fn(() => ({}));
const tokenInfoMock = vi.fn();
const tokenInfo = {
  l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  name: "Ether",
  symbol: "ETH",
  decimals: 18,
  usdPrice: 150,
};

vi.mock("vue-router", () => ({
  useRouter: () => router,
  useRoute: () => ({
    query: routeQueryMock(),
  }),
}));

describe("Account:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  vi.mock("@/composables/useToken", () => {
    return {
      default: () => ({
        getTokenInfo: () => undefined,
        tokenInfo: computed(() => tokenInfoMock()),
        isRequestPending: computed(() => false),
      }),
    };
  });

  vi.mock("@/composables/useTokenOverview", () => {
    return {
      default: () => ({
        getTokenOverview: () => undefined,
        tokenOverview: computed(() => ({
          totalSupply: 100000000000000000000000000,
        })),
      }),
    };
  });

  const renderToken = () =>
    render(Token, {
      props: {
        contract: {
          accountType: "eOA",
          address: "0xDB754A7833163caAB170814c5F9cAf32F09FDEd4",
          balances: {},
          sealedNonce: 0,
          verifiedNonce: 0,
        },
      },
      global: {
        plugins: [i18n, $testId],
        stubs: { RouterLink: RouterLinkStub, TransfersTable: { template: "<div />" } },
      },
    });

  it("renders component", () => {
    tokenInfoMock.mockReturnValue(tokenInfo);
    const { container } = renderToken();
    expect(container.querySelector(".breadcrumb-item-active")?.textContent).toBe("Token 0xDB75...DEd4");
    expect(container.querySelector(".token-info-table")).not.toBeNull();
    expect(container.querySelector(".transactions-table")).toBeDefined();
  });

  it("does not render token info tables when token info is not found", () => {
    tokenInfoMock.mockReturnValue(null);
    const { container } = renderToken();
    expect(container.querySelector(".token-info-table")).toBeNull();
    expect(container.textContent).not.toContain(enUS.transactions.table.notFound);
    expect(container.querySelector(".contract-tabs")).not.toBeNull();
  });
});
