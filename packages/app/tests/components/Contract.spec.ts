import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { render } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";

import { useContextMock } from "./../mocks";

import Contract from "@/components/Contract.vue";

import ERC20Contract from "@/../mock/contracts/ERC20.json";
import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

const router = {
  replace: vi.fn(),
  currentRoute: {
    value: {},
  },
};

vi.mock("vue-router", () => ({
  useRouter: () => router,
  useRoute: () => ({
    query: {
      page: vi.fn(),
    },
  }),
}));

describe("Contract:", () => {
  let mockContext: SpyInstance;

  beforeEach(() => {
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
  });

  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders component", () => {
    const { container } = render(Contract, {
      props: {
        contract: {
          ...ERC20Contract.info,
          verificationInfo: null,
        },
        pending: false,
        failed: false,
      },
      global: {
        plugins: [i18n, $testId],
        stubs: { RouterLink: RouterLinkStub, TransfersTable: { template: "<div />" } },
      },
    });
    expect(container.querySelector(".breadcrumb-item-active")?.textContent).toBe("Contract 0x0cc7...dc1b");
    expect(container.querySelector(".title-container")?.textContent?.replace(/\u00a0/g, " ")).toBe(
      "Contract  0x0cc7...dc1b"
    );
    expect(container.querySelector(".contract-info-table")).toBeDefined();
    expect(container.querySelector(".balance-table")).toBeDefined();
    const tabs = container.querySelectorAll(".tab-head li");
    expect(tabs[0].querySelector("button")?.textContent).toBe("Transactions");
    expect(tabs[1].querySelector("button")?.textContent).toBe("Transfers");
    expect(tabs[2].querySelector("button")?.textContent).toBe("Contract");
    expect(tabs[3].querySelector("button")?.textContent).toBe("Events");
  });
  it("renders contract name in the headline when contract is verified", () => {
    const { container } = render(Contract, {
      props: {
        contract: ERC20Contract.info,
        pending: false,
        failed: false,
      },
      global: {
        plugins: [i18n, $testId],
        stubs: ["router-link"],
      },
    });
    expect(container.querySelector(".title-container")?.textContent?.trim()).toBe("DARA2");
  });
});
