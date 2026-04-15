import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PrividiumAuth } from "@/lib/prividium-auth";
import { PRIVIDIUM_AUTH_CONSTANTS } from "@/lib/prividium-auth/constants";

const CONFIG = {
  clientId: "block-explorer",
  redirectUri: "https://explorer.test/auth/callback",
  userPanelUrl: "https://user-panel.test",
};

// `crypto` isn't a Node global until v19; jsdom doesn't provide it either. Stub for CI.
if (typeof (globalThis as { crypto?: Crypto }).crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i;
        }
        return array;
      },
    },
  });
}

describe("PrividiumAuth redirect lifecycle:", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // jsdom's `window.location.href` is read-only; swap in a mutable stub so login() can set it.
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        ...originalLocation,
        hash: "",
        href: originalLocation.origin,
      } as Location,
    });
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stashes the redirectPath in sessionStorage when login(path) is called", () => {
    const auth = new PrividiumAuth(CONFIG);

    auth.login("/tx/0xabc");

    expect(sessionStorage.getItem(PRIVIDIUM_AUTH_CONSTANTS.REDIRECT_KEY)).toBe("/tx/0xabc");
  });

  it("clears any stale redirect when login() is called without a path", () => {
    sessionStorage.setItem(PRIVIDIUM_AUTH_CONSTANTS.REDIRECT_KEY, "/tx/0xstale");
    const auth = new PrividiumAuth(CONFIG);

    auth.login();

    expect(sessionStorage.getItem(PRIVIDIUM_AUTH_CONSTANTS.REDIRECT_KEY)).toBeNull();
  });

  it("handleCallback() returns the stashed redirect and clears REDIRECT_KEY", () => {
    const auth = new PrividiumAuth(CONFIG);
    auth.login("/tx/0xabc");
    const savedState = sessionStorage.getItem(PRIVIDIUM_AUTH_CONSTANTS.STATE_KEY)!;
    window.location.hash = `#token=mock-jwt&state=${savedState}`;

    const result = auth.handleCallback();

    expect(result).toEqual({
      token: "mock-jwt",
      state: savedState,
      redirect: "/tx/0xabc",
    });
    expect(sessionStorage.getItem(PRIVIDIUM_AUTH_CONSTANTS.REDIRECT_KEY)).toBeNull();
    expect(sessionStorage.getItem(PRIVIDIUM_AUTH_CONSTANTS.STATE_KEY)).toBeNull();
  });

  it("handleCallback() returns redirect: null when nothing was stashed", () => {
    const auth = new PrividiumAuth(CONFIG);
    auth.login();
    const savedState = sessionStorage.getItem(PRIVIDIUM_AUTH_CONSTANTS.STATE_KEY)!;
    window.location.hash = `#token=mock-jwt&state=${savedState}`;

    const result = auth.handleCallback();

    expect(result?.redirect).toBeNull();
  });

  // Returned verbatim so the view layer owns navigation safety (no cross-origin sanitization here).
  it("handleCallback() returns the redirect verbatim", () => {
    const auth = new PrividiumAuth(CONFIG);
    auth.login("/tx/0xabc?foo=bar#section");
    const savedState = sessionStorage.getItem(PRIVIDIUM_AUTH_CONSTANTS.STATE_KEY)!;
    window.location.hash = `#token=mock-jwt&state=${savedState}`;

    const result = auth.handleCallback();

    expect(result?.redirect).toBe("/tx/0xabc?foo=bar#section");
  });
});
