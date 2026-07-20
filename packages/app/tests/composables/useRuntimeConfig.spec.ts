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

  it("resolves contact to null when explicitly hidden", () => {
    setRuntimeConfig({ links: { contactUsUrl: "" } });
    const { links } = useRuntimeConfig();
    expect(links.contactUsUrl).toBeNull();
  });
});

describe("useRuntimeConfig: docs and terms resolution", () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any)["##runtimeConfig"];
  });

  it("falls back to the ZKsync URLs when nothing is set", () => {
    const { links } = useRuntimeConfig();
    expect(links.docsUrl).toBe("https://docs.zksync.io/zksync-network/tooling/block-explorers");
    expect(links.termsOfServiceUrl).toBe("https://zksync.io/terms");
  });

  it("uses the operator URLs when runtime config provides them", () => {
    setRuntimeConfig({
      links: { docsUrl: "https://bank-xyz.example/docs", termsOfServiceUrl: "https://bank-xyz.example/terms" },
    });
    const { links } = useRuntimeConfig();
    expect(links.docsUrl).toBe("https://bank-xyz.example/docs");
    expect(links.termsOfServiceUrl).toBe("https://bank-xyz.example/terms");
  });

  it("resolves to null when explicitly hidden with an empty string", () => {
    setRuntimeConfig({ links: { docsUrl: "", termsOfServiceUrl: "" } });
    const { links } = useRuntimeConfig();
    expect(links.docsUrl).toBeNull();
    expect(links.termsOfServiceUrl).toBeNull();
  });

  it("resolves to null when explicitly hidden with null", () => {
    setRuntimeConfig({ links: { docsUrl: null, termsOfServiceUrl: null } });
    const { links } = useRuntimeConfig();
    expect(links.docsUrl).toBeNull();
    expect(links.termsOfServiceUrl).toBeNull();
  });
});
