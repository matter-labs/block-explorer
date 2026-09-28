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

function pain001({ amount, debtor, creditor }: { amount?: string; debtor?: string; creditor?: string }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr><MsgId>PRIV-1</MsgId></GrpHdr>
    <PmtInf>
      <Dbtr><Nm>Example Bank N.A.</Nm></Dbtr>
      ${debtor === undefined ? "" : `<DbtrAcct><Id><Othr><Id>${debtor}</Id></Othr></Id></DbtrAcct>`}
      <CdtTrfTxInf>
        ${amount === undefined ? "" : `<Amt><InstdAmt Ccy="USD">${amount}</InstdAmt></Amt>`}
        <Cdtr><Nm>Victim Ltd</Nm></Cdtr>
        ${creditor === undefined ? "" : `<CdtrAcct><Id><Othr><Id>${creditor}</Id></Othr></Id></CdtrAcct>`}
        <RmtInf><Ustrd>Invoice 4471 paid in full</Ustrd></RmtInf>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

const check = (memo: string, overrides: Partial<TokenTransfer> = {}) =>
  isIso20022MemoMismatch(parseIso20022Pain001(memo), { ...transfer, ...overrides });

describe("isIso20022MemoMismatch:", () => {
  it("returns false when accounts and amount match the transfer", () => {
    expect(check(pain001({ amount: "1234.56", debtor: sender, creditor: receiver }))).toBe(false);
  });

  it("compares accounts case-insensitively", () => {
    expect(check(pain001({ amount: "1234.56", debtor: sender.toLowerCase(), creditor: receiver.toUpperCase() }))).toBe(
      false
    );
  });

  it("returns false when the memo carries no accounts or amount to check", () => {
    expect(check(pain001({}))).toBe(false);
  });

  it("returns false when the memo is not a pain.001 document", () => {
    expect(isIso20022MemoMismatch(parseIso20022Pain001("not xml"), transfer)).toBe(false);
  });

  it("returns true when the instructed amount differs from the transferred amount", () => {
    expect(check(pain001({ amount: "1000000.00", debtor: sender, creditor: receiver }))).toBe(true);
  });

  it("returns true for a large memo amount next to a 1 wei transfer", () => {
    expect(
      check(pain001({ amount: "1000000.00" }), {
        amount: "1",
        tokenInfo: { ...transfer.tokenInfo!, decimals: 18 },
      })
    ).toBe(true);
  });

  it("returns true when the instructed amount is not a number", () => {
    expect(check(pain001({ amount: "1,234.56" }))).toBe(true);
    expect(check(pain001({ amount: "abc" }))).toBe(true);
  });

  it("scales the transferred amount by the token decimals", () => {
    expect(check(pain001({ amount: "1234.560000" }))).toBe(false);
    expect(check(pain001({ amount: "123456" }))).toBe(true);
    expect(
      check(pain001({ amount: "12.340000000000000000" }), {
        amount: "12340000000000000000",
        tokenInfo: { ...transfer.tokenInfo!, decimals: 18 },
      })
    ).toBe(false);
  });

  it("accepts the float noise of an amount written with Number#toFixed", () => {
    // What the ISO 20022 sender app writes for 12.34 of an 18-decimals token.
    expect(
      check(pain001({ amount: (12.34).toFixed(18) }), {
        amount: "12340000000000000000",
        tokenInfo: { ...transfer.tokenInfo!, decimals: 18 },
      })
    ).toBe(false);
  });

  it("returns true when the debtor account is not the transfer sender", () => {
    expect(check(pain001({ amount: "1234.56", debtor: receiver, creditor: receiver }))).toBe(true);
  });

  it("returns true when the creditor account is not the transfer receiver", () => {
    expect(check(pain001({ amount: "1234.56", debtor: sender, creditor: sender }))).toBe(true);
  });

  it("returns true when an account is not the on-chain address (e.g. a bank account number)", () => {
    expect(check(pain001({ debtor: "DE89370400440532013000" }))).toBe(true);
    // Zero-width space inside an otherwise matching address.
    expect(check(pain001({ creditor: `${receiver.slice(0, 10)}\u200b${receiver.slice(10)}` }))).toBe(true);
  });

  it("returns true when the memo has an amount but the transfer has no token info", () => {
    expect(check(pain001({ amount: "1234.56" }), { tokenInfo: undefined })).toBe(true);
  });
});
