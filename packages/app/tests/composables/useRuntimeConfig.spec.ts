import { afterEach, describe, expect, it } from "vitest";

import useRuntimeConfig from "@/composables/useRuntimeConfig";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setRuntimeConfig = (value: unknown) => ((window as any)["##runtimeConfig"] = value);

describe("useRuntimeConfig: contact us resolution", () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any)["##runtimeConfig"];
  });

  it("marks contact us as configured when runtime config provides a URL", () => {
    setRuntimeConfig({ links: { contactUsUrl: "https://bank-xyz.example/support" } });
    const { links } = useRuntimeConfig();
    expect(links.contactUsUrl).toBe("https://bank-xyz.example/support");
    expect(links.hasContactUs).toBe(true);
  });

  it("falls back to the ZKsync URL and reports not configured when nothing is set", () => {
    const { links } = useRuntimeConfig();
    expect(links.contactUsUrl).toBe("https://zksync.io/contact");
    expect(links.hasContactUs).toBe(false);
  });
});
