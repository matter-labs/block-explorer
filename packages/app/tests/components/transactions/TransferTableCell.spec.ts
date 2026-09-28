import { createI18n } from "vue-i18n";

import { afterEach, describe, expect, it } from "vitest";

import { cleanup, fireEvent, render } from "@testing-library/vue";
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
            name: "ChainLink Token (testnet)",
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

  describe("ISO 20022 memo", () => {
    const transfer = {
      amount: "123456",
      from: "0x6c10d9C1744F149D4B17660E14FaA247964749c7",
      to: "0xD5736a5c56498577b8e699520fe20b57Ac91D491",
      type: "transfer",
      fromNetwork: "L2",
      toNetwork: "L2",
      tokenInfo: { decimals: 2, l2Address: "0x4732C03B2CF6eDe46500e799DE79a15Df44929eB", symbol: "ISO" },
    };
    const pain001 = (amount: string, debtor = transfer.from) => `<Document>
  <CstmrCdtTrfInitn>
    <PmtInf>
      <DbtrAcct><Id><Othr><Id>${debtor}</Id></Othr></Id></DbtrAcct>
      <CdtTrfTxInf>
        <Amt><InstdAmt Ccy="USD">${amount}</InstdAmt></Amt>
        <CdtrAcct><Id><Othr><Id>${transfer.to}</Id></Othr></Id></CdtrAcct>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
    const renderWithMemo = (memo: string) => render(TransferTableCell, { global, props: { transfer, memo } });

    afterEach(cleanup);

    it("labels a matching memo as unverified", async () => {
      const { getByText, queryByText } = renderWithMemo(pain001("1234.56"));
      await fireEvent.click(getByText("ISO 20022 payment"));

      expect(getByText(enUS.transactions.table.iso20022.unverified)).toBeTruthy();
      expect(queryByText(enUS.transactions.table.iso20022.mismatch)).toBeNull();
    });

    it("flags an amount mismatch", async () => {
      const { container, getByText } = renderWithMemo(pain001("1000000.00"));
      expect(container.querySelector(".transfer-memo-badge.is-mismatch")).toBeTruthy();
      await fireEvent.click(getByText(enUS.transactions.table.iso20022.badgeMismatch));

      expect(getByText(enUS.transactions.table.iso20022.mismatch)).toBeTruthy();
    });

    it("renders an account that is not an address as text", async () => {
      const { container, getByText } = renderWithMemo(pain001("1234.56", "DE89370400440532013000"));
      await fireEvent.click(container.querySelector(".transfer-memo-badge")!);

      expect(getByText("DE89370400440532013000").tagName).toBe("SPAN");
    });
  });
});
