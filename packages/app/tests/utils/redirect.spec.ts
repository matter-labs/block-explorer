import { describe, expect, it } from "vitest";

import { isValidRedirectPath } from "@/utils/redirect";

describe("isValidRedirectPath", () => {
  it.each(["/", "/tx/0xabc", "/tx/0xabc?foo=bar#section", "/explorer/address/0x1", "/%5Cevil.example"])(
    "accepts same-origin relative path %j",
    (path) => {
      expect(isValidRedirectPath(path)).toBe(true);
    }
  );

  it.each([
    undefined,
    null,
    123,
    [["/tx/0xabc"]],
    "",
    "tx/0xabc",
    " /tx/0xabc",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "https://phishing.example/harvest",
    "//phishing.example/harvest",
    "/\\phishing.example",
    "\\\\phishing.example",
    "/\t/phishing.example",
    "/\n/phishing.example",
    "/\r\\phishing.example",
  ])("rejects %j", (path) => {
    expect(isValidRedirectPath(path)).toBe(false);
  });

  it("rejects an unparseable path without throwing", () => {
    expect(isValidRedirectPath("/\t/[")).toBe(false);
  });
});
