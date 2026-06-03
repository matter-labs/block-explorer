import { afterEach, describe, expect, it } from "vitest";

import { appRootUrl, appUrl, basePathPrefix, currentAppPath, getBasePath, publicAsset } from "@/utils/basePath";

const setBaseTag = (href: string) => {
  const base = document.createElement("base");
  base.setAttribute("href", href);
  document.head.appendChild(base);
};

const removeBaseTag = () => {
  document.querySelector("base")?.remove();
};

describe("basePath:", () => {
  afterEach(() => {
    removeBaseTag();
  });

  describe("getBasePath", () => {
    it("returns '/' when no base tag is present", () => {
      expect(getBasePath()).toBe("/");
    });

    it("returns '/' for a root base tag", () => {
      setBaseTag("/");
      expect(getBasePath()).toBe("/");
    });

    it("returns the subpath from the base tag", () => {
      setBaseTag("/explorer/");
      expect(getBasePath()).toBe("/explorer/");
    });

    it("adds a trailing slash when the base tag has none", () => {
      setBaseTag("/explorer");
      // Per URL resolution rules "/explorer" resolves to the "/" directory,
      // so an explicitly configured base must include the trailing slash.
      // getBasePath still normalizes its own output to end with "/".
      expect(getBasePath().endsWith("/")).toBe(true);
    });

    it("resolves an absolute base tag href to its pathname", () => {
      setBaseTag("https://example.com/explorer/");
      expect(getBasePath()).toBe("/explorer/");
    });
  });

  describe("publicAsset", () => {
    it("keeps root-absolute paths unchanged without a base tag", () => {
      expect(publicAsset("/images/metamask.svg")).toBe("/images/metamask.svg");
    });

    it("prefixes root-absolute paths with the base path", () => {
      setBaseTag("/explorer/");
      expect(publicAsset("/images/metamask.svg")).toBe("/explorer/images/metamask.svg");
    });

    it("prefixes bare paths with the base path", () => {
      setBaseTag("/explorer/");
      expect(publicAsset("images/metamask.svg")).toBe("/explorer/images/metamask.svg");
    });

    it("keeps fully qualified urls unchanged", () => {
      setBaseTag("/explorer/");
      expect(publicAsset("https://example.com/icon.svg")).toBe("https://example.com/icon.svg");
      expect(publicAsset("http://example.com/icon.svg")).toBe("http://example.com/icon.svg");
    });

    it("keeps protocol-relative urls unchanged", () => {
      setBaseTag("/explorer/");
      expect(publicAsset("//example.com/icon.svg")).toBe("//example.com/icon.svg");
    });

    it("keeps data urls unchanged", () => {
      setBaseTag("/explorer/");
      expect(publicAsset("data:image/svg+xml;base64,abc")).toBe("data:image/svg+xml;base64,abc");
    });

    it("passes through nullish and empty values unchanged", () => {
      setBaseTag("/explorer/");
      expect(publicAsset(undefined)).toBe(undefined);
      expect(publicAsset(null)).toBe(undefined);
      expect(publicAsset("")).toBe("");
    });
  });

  describe("appUrl", () => {
    it("returns the origin root url without a base tag", () => {
      expect(appUrl()).toBe(`${window.location.origin}/`);
    });

    it("appends the app path to origin without a base tag", () => {
      expect(appUrl("login")).toBe(`${window.location.origin}/login`);
      expect(appUrl("/login")).toBe(`${window.location.origin}/login`);
    });

    it("includes the base path", () => {
      setBaseTag("/explorer/");
      expect(appUrl()).toBe(`${window.location.origin}/explorer/`);
      expect(appUrl("auth/callback")).toBe(`${window.location.origin}/explorer/auth/callback`);
    });
  });

  describe("basePathPrefix", () => {
    it("returns an empty string without a base tag", () => {
      expect(basePathPrefix()).toBe("");
    });

    it("returns the base path without a trailing slash", () => {
      setBaseTag("/explorer/");
      expect(basePathPrefix()).toBe("/explorer");
    });
  });

  describe("appRootUrl", () => {
    it("returns the bare origin without a base tag", () => {
      expect(appRootUrl()).toBe(window.location.origin);
    });

    it("returns origin plus prefix without a trailing slash", () => {
      setBaseTag("/explorer/");
      expect(appRootUrl()).toBe(`${window.location.origin}/explorer`);
    });
  });

  describe("currentAppPath", () => {
    it("returns the pathname unchanged without a base tag", () => {
      expect(currentAppPath()).toBe(window.location.pathname);
    });

    it("strips the base path from the pathname", () => {
      setBaseTag("/explorer/");
      history.replaceState(null, "", "/explorer/blocks");
      try {
        expect(currentAppPath()).toBe("/blocks");
      } finally {
        history.replaceState(null, "", "/");
      }
    });

    it("returns '/' for the bare prefix without a trailing slash", () => {
      setBaseTag("/explorer/");
      history.replaceState(null, "", "/explorer");
      try {
        expect(currentAppPath()).toBe("/");
      } finally {
        history.replaceState(null, "", "/");
      }
    });

    it("returns the pathname unchanged when it does not start with the base path", () => {
      setBaseTag("/explorer/");
      history.replaceState(null, "", "/blocks");
      try {
        expect(currentAppPath()).toBe("/blocks");
      } finally {
        history.replaceState(null, "", "/");
      }
    });
  });
});
