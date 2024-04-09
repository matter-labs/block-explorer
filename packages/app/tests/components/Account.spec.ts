import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";

import Account from "@/components/Account.vue";

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
  useRoute: () => vi.fn(),
}));

describe("Account:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders component", () => {
    const { container } = render(Account, {
      props: {
        account: {
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
    expect(container.querySelector(".breadcrumb-item-active")?.textContent).toBe("Account 0xDB75...DEd4");
    expect(container.querySelector(".contract-info-table")).toBeDefined();
    expect(container.querySelector(".balance-table")).toBeDefined();
    expect(container.querySelector(".transactions-table")).toBeDefined();
  });
});
