import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { afterAll, beforeAll, describe, expect, it, type SpyInstance, vi } from "vitest";

import { render, type RenderResult } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";

import { useContextMock, useTokenHoldersMock } from "../../mocks";

import TokenHolderList from "@/components/token/TokenHoldersList.vue";

import enUS from "@/locales/en.json";
import elements from "tests/e2e/testId.json";

import $testId from "@/plugins/testId";

const router = {
  push: vi.fn(),
};
const routeQueryMock = vi.fn(() => ({}));
vi.mock("vue-router", () => ({
  useRouter: () => router,
  useRoute: () => ({
    query: routeQueryMock(),
  }),
}));

describe("TokenListTable:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  let renderResult: RenderResult | null;
  let mockContext: SpyInstance;
  let mockHolders: SpyInstance;

  beforeAll(() => {
    mockHolders = useTokenHoldersMock({
      data: computed(() => [
        {
          address: "0xe1134444211593Cfda9fc9eCc7B43208615556E2",
          balance: "5000000000000000000",
        },
      ]),
    });
    mockContext = useContextMock();

    renderResult = render(TokenHolderList, {
      global: {
        plugins: [i18n, $testId],
        stubs: { RouterLink: RouterLinkStub },
      },
      props: {
        tokenInfo: {
          decimals: 18,
          iconURL: "https://icon.com",
          l1Address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          l2Address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          liquidity: 22000000000000000000000,
          name: "Ether",
          symbol: "ETH",
          usdPrice: 150,
        },
        loading: false,
        useQueryPagination: false,
        notFound: false,
      },
    });
  });

  afterAll(() => {
    mockContext?.mockRestore();
    mockHolders?.mockRestore();
    renderResult?.unmount();
  });

  it("renders transaction hash column", () => {
    expect(renderResult!.getByTestId(elements.tokenHoldersAddress).textContent).toEqual("0xe11344442115...56E2");
  });

  it("renders timestamp column", () => {
    expect(renderResult!.getByTestId(elements.tokenHoldersBalance).textContent).toEqual("5.0");
  });

  it("renders type column", () => {
    expect(renderResult!.getByTestId(elements.tokenHoldersPercentage).textContent).toEqual("0.0227 %");
  });

  it("renders from column", () => {
    expect(renderResult!.getByTestId(elements.tokenHoldersValue).textContent).toEqual("$750.00");
  });
});
