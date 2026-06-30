import { afterEach, describe, expect, it, vi } from "vitest";

// appBase/appPrefix are module-level consts read from window at import time, so each scenario sets the
// window globals, resets the module registry, and re-imports to get freshly-evaluated values.
async function loadAppBase(appBase?: string, assetsBase?: string) {
  vi.resetModules();
  if (appBase === undefined) {
    delete (window as unknown as { __APP_BASE__?: string }).__APP_BASE__;
  } else {
    (window as unknown as { __APP_BASE__?: string }).__APP_BASE__ = appBase;
  }
  if (assetsBase === undefined) {
    delete (window as unknown as { __ASSETS_BASE__?: string }).__ASSETS_BASE__;
  } else {
    (window as unknown as { __ASSETS_BASE__?: string }).__ASSETS_BASE__ = assetsBase;
  }
  return import("@/utils/appBase");
}

afterEach(() => {
  delete (window as unknown as { __APP_BASE__?: string }).__APP_BASE__;
  delete (window as unknown as { __ASSETS_BASE__?: string }).__ASSETS_BASE__;
  vi.resetModules();
});

describe("appBase / appPrefix", () => {
  it("defaults to root when no base is configured", async () => {
    const { appBase, appPrefix } = await loadAppBase();
    expect(appPrefix).toBe("");
    expect(appBase).toBe("/");
  });

  it("derives prefix and base from a subpath", async () => {
    const { appBase, appPrefix } = await loadAppBase("/explorer/");
    expect(appPrefix).toBe("/explorer");
    expect(appBase).toBe("/explorer/");
  });

  it("normalizes a subpath without a trailing slash", async () => {
    const { appBase, appPrefix } = await loadAppBase("/explorer");
    expect(appPrefix).toBe("/explorer");
    expect(appBase).toBe("/explorer/");
  });
});

describe("resolveBase", () => {
  it("returns the path unchanged at root", async () => {
    const { resolveBase } = await loadAppBase();
    expect(resolveBase("/login")).toBe("/login");
    expect(resolveBase("/")).toBe("/");
  });

  it("prefixes the path with the base under a subpath", async () => {
    const { resolveBase } = await loadAppBase("/explorer/");
    expect(resolveBase("/login")).toBe("/explorer/login");
    expect(resolveBase("/")).toBe("/explorer/");
    expect(resolveBase("/tx/0xabc")).toBe("/explorer/tx/0xabc");
  });
});

describe("resolveAsset", () => {
  it("resolves against the app base when no assets base is set", async () => {
    const root = await loadAppBase();
    expect(root.resolveAsset("/images/x.svg")).toBe("/images/x.svg");

    const sub = await loadAppBase("/explorer/");
    expect(sub.resolveAsset("/images/x.svg")).toBe("/explorer/images/x.svg");
    expect(sub.resolveAsset("images/x.svg")).toBe("/explorer/images/x.svg");
  });

  it("resolves against the assets base (CDN) when set, independent of the app base", async () => {
    const { resolveAsset, resolveBase } = await loadAppBase("/explorer/", "https://cdn.example.com/123/");
    expect(resolveAsset("/images/x.svg")).toBe("https://cdn.example.com/123/images/x.svg");
    // resolveBase still uses the app base, not the CDN.
    expect(resolveBase("/login")).toBe("/explorer/login");
  });

  it("passes through external, protocol-relative, data: and empty paths unchanged", async () => {
    const { resolveAsset } = await loadAppBase("/explorer/", "https://cdn.example.com/");
    expect(resolveAsset("https://other.example.com/icon.svg")).toBe("https://other.example.com/icon.svg");
    expect(resolveAsset("http://other.example.com/icon.svg")).toBe("http://other.example.com/icon.svg");
    expect(resolveAsset("//other.example.com/icon.svg")).toBe("//other.example.com/icon.svg");
    expect(resolveAsset("data:image/svg+xml;base64,abc")).toBe("data:image/svg+xml;base64,abc");
    expect(resolveAsset("")).toBe("");
  });
});
