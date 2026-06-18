import { afterEach, describe, expect, it } from "vitest";

import useRuntimeConfig from "@/composables/useRuntimeConfig";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setRuntimeConfig = (value: unknown) => ((window as any)["##runtimeConfig"] = value);

describe("useRuntimeConfig: contact us resolution", () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any)["##runtimeConfig"];
  });

  it("uses the operator URL when runtime config provides one", () => {
    setRuntimeConfig({ links: { contactUsUrl: "https://bank-xyz.example/support" } });
    const { links } = useRuntimeConfig();
    expect(links.contactUsUrl).toBe("https://bank-xyz.example/support");
  });

  it("falls back to the ZKsync URL when nothing is set", () => {
    const { links } = useRuntimeConfig();
    expect(links.contactUsUrl).toBe("https://zksync.io/contact");
  });

  it("resolves to null in prividium mode when no URL is configured", () => {
    setRuntimeConfig({ appEnvironment: "prividium" });
    const { links } = useRuntimeConfig();
    expect(links.contactUsUrl).toBeNull();
  });

  it("uses the operator URL in prividium mode when configured", () => {
    setRuntimeConfig({ appEnvironment: "prividium", links: { contactUsUrl: "https://bank-xyz.example/support" } });
    const { links } = useRuntimeConfig();
    expect(links.contactUsUrl).toBe("https://bank-xyz.example/support");
  });
});
