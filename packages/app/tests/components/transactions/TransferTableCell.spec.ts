import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";

import TransferTableCell from "@/components/transactions/infoTable/TransferTableCell.vue";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

describe("TransferTableCell:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  const global = {
    plugins: [i18n, $testId],
    stubs: { RouterLink: RouterLinkStub },
  };
  it("renders component properly", () => {
    const { container } = render(TransferTableCell, {
      global,
      props: {
        transfer: {
          amount: "0x56bc75e2d63100000",
          from: "0x6c10d9c1744f149d4b17660e14faa247964749c7",
          to: "0xd5736a5c56498577b8e699520fe20b57ac91d491",
          type: "transfer",
          fromNetwork: "L2",
          toNetwork: "L2",
          tokenInfo: {
            decimals: 18,
            l1Address: "0x63bfb2118771bd0da7a6936667a7bb705a06c1ba",
            l2Address: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
            name: "ChainLink Token (goerli)",
            symbol: "LINK",
            usdPrice: 1,
          },
        },
      },
    });

    expect(container.querySelector(".transfer-container")).toBeTruthy();
    expect(container.querySelector(".transfer-amount-container")).toBeTruthy();
    expect(container.querySelectorAll(".transfer-amount-container span").length).toBe(4);
    expect(container.querySelectorAll(".transfer-amount-container span")[0]?.textContent).toBe("for");
    expect(container.querySelectorAll(".transfer-amount-container span")[1]?.textContent).toBe("100");
    expect(container.querySelectorAll(".transfer-amount-container span")[2]?.textContent).toBe("LINK");
  });
});
