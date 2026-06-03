/**
 * Helpers for resolving URLs when the app is served from a subpath (e.g. /explorer/).
 *
 * The base path can be set either at build time (VITE_BASE_PATH, see vite.config.ts)
 * or at container start (BASE_PATH env var injected as a <base> tag in index.html,
 * see Dockerfile). Reading the live <base> tag covers both cases.
 */

function ensureTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * Returns the base path the app is served from, with leading and trailing slashes.
 * Defaults to "/" when no base is configured (current behavior).
 */
export function getBasePath(): string {
  if (typeof document !== "undefined") {
    const baseHref = document.querySelector("base")?.getAttribute("href");
    if (baseHref) {
      const url = new URL(baseHref, window.location.origin);
      return ensureTrailingSlash(url.pathname);
    }
  }
  const buildTimeBase = import.meta.env.BASE_URL || "/";
  if (buildTimeBase === "./" || buildTimeBase === ".") {
    return "/";
  }
  return ensureTrailingSlash(buildTimeBase);
}

/**
 * Returns the base path without the trailing slash ("" for root, "/explorer" for
 * a subpath), for prepending to router-relative paths.
 */
export function basePathPrefix(): string {
  return getBasePath().replace(/\/$/, "");
}

/**
 * Resolves a public asset path (e.g. "/images/metamask.svg") against the app base path.
 * Fully qualified, protocol-relative and data: URLs are returned unchanged so that
 * external icon/logo URLs from network configs keep working.
 */
export function publicAsset(path: string): string;
export function publicAsset(path: string | null | undefined): string | undefined;
export function publicAsset(path: string | null | undefined): string | undefined {
  if (path == null || path === "") {
    return path ?? undefined;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) {
    return path;
  }
  return getBasePath() + path.replace(/^\//, "");
}

/**
 * Builds an absolute app URL (origin + base path + app path), e.g. for full-page
 * redirects and OAuth redirect URIs.
 */
export function appUrl(path = ""): string {
  return new URL(getBasePath() + path.replace(/^\//, ""), window.location.origin).toString();
}

/**
 * Returns an absolute URL to the app root without a trailing slash beyond the
 * origin (e.g. "https://host" or "https://host/explorer"), preserving the
 * pre-base-path format expected by external consumers (MetaMask, OAuth
 * redirect allowlists).
 */
export function appRootUrl(): string {
  return window.location.origin + basePathPrefix();
}

/**
 * Returns the current router-relative path (window.location.pathname with the base
 * path stripped), suitable for use as a redirect target for router.push().
 */
export function currentAppPath(): string {
  const base = getBasePath();
  const { pathname } = window.location;
  if (base === "/") {
    return pathname;
  }
  // Bare prefix without the trailing slash (e.g. "/explorer").
  if (pathname === basePathPrefix()) {
    return "/";
  }
  return pathname.startsWith(base) ? pathname.slice(base.length - 1) : pathname;
}
