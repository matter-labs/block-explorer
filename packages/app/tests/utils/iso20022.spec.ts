import { describe, expect, it } from "vitest";

import type { TokenTransfer } from "@/composables/useTransaction";

import { isIso20022MemoMismatch, parseIso20022Pain001 } from "@/utils/iso20022";

const sender = "0x6c10d9C1744F149D4B17660E14FaA247964749c7";
const receiver = "0xD5736a5c56498577b8e699520fe20b57Ac91D491";

const transfer: TokenTransfer = {
  amount: "123456",
  from: sender,
  to: receiver,
  type: "transfer",
  fromNetwork: "L2",
  toNetwork: "L2",
  tokenInfo: {
    decimals: 2,
    l1Address: null,
    l2Address: "0x4732C03B2CF6eDe46500e799DE79a15Df44929eB",
    name: "ISO Token",
    symbol: "ISO",
  },
} as unknown as TokenTransfer;
const token18 = { amount: "12340000000000000000", tokenInfo: { ...transfer.tokenInfo!, decimals: 18 } };

// An empty amount or account leaves that element out of the memo.
function pain001({ amount = "1234.56", currency = "USD", debtor = sender, creditor = receiver } = {}) {
  return `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <PmtInf>
      ${debtor && `<DbtrAcct><Id><Othr><Id>${debtor}</Id></Othr></Id></DbtrAcct>`}
      <CdtTrfTxInf>
        ${amount && `<Amt><InstdAmt Ccy="${currency}">${amount}</InstdAmt></Amt>`}
        ${creditor && `<CdtrAcct><Id><Othr><Id>${creditor}</Id></Othr></Id></CdtrAcct>`}
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

const check = (memo: string, overrides: Partial<TokenTransfer> = {}) =>
  isIso20022MemoMismatch(parseIso20022Pain001(memo), { ...transfer, ...overrides });

describe("isIso20022MemoMismatch:", () => {
  it("returns false when accounts (in any case) and amount match the transfer", () => {
    expect(check(pain001({ debtor: sender.toLowerCase(), creditor: receiver.toUpperCase() }))).toBe(false);
  });

  it("scales the transferred amount by the token decimals and accepts Number#toFixed float noise", () => {
    // What the ISO 20022 sender app writes for 12.34 of an 18-decimals token.
    expect(check(pain001({ amount: (12.34).toFixed(18) }), token18)).toBe(false);
  });

  it("returns true for a large memo amount next to a 1 wei transfer", () => {
    expect(check(pain001({ amount: "1000000.00" }), { ...token18, amount: "1" })).toBe(true);
  });

  it("returns true when the amount is not a plain decimal, even if it equals the transferred amount", () => {
    expect(check(pain001({ amount: "1000000.00e-24" }), { ...token18, amount: "1" })).toBe(true);
    expect(check(pain001({ amount: "1e6" }), { amount: "100000000" })).toBe(true);
  });

  it("returns true when the currency is not an ISO 4217 code", () => {
    // Displayed as the amount "1 000 000.00 USD".
    expect(check(pain001({ amount: "1", currency: "000 000.00 USD" }), { amount: "100" })).toBe(true);
  });

  it("returns true when the memo leaves out the amount or an account", () => {
    expect(check(pain001({ amount: "" }))).toBe(true);
    expect(check(pain001({ debtor: "" }))).toBe(true);
    expect(check(pain001({ creditor: "" }))).toBe(true);
  });

  it("returns true when the memo cannot be parsed or repeats a payment instruction", () => {
    expect(check("PAYMENT CONFIRMED 1,000,000.00 USD")).toBe(true);
    // Only the first amount would be checked, while the raw memo also shows the second one.
    expect(
      check(pain001().replace("</CdtTrfTxInf>", "<Amt><InstdAmt Ccy='USD'>1000000.00</InstdAmt></Amt></CdtTrfTxInf>"))
    ).toBe(true);
  });

  it("returns true when the debtor account is not the transfer sender", () => {
    expect(check(pain001({ debtor: receiver }))).toBe(true);
  });

  it("returns true when the transfer has no token info", () => {
    expect(check(pain001(), { tokenInfo: undefined })).toBe(true);
  });
});
