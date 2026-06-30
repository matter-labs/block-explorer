// Runtime app base and assets base, published on `window` by a script in index.html.
declare global {
  interface Window {
    __APP_BASE__?: string;
    __ASSETS_BASE__?: string;
  }
}

export const appPrefix = ((typeof window !== "undefined" && window.__APP_BASE__) || "/").replace(/\/+$/, "");
export const appBase = `${appPrefix}/`;

const assetsBase = (typeof window !== "undefined" && window.__ASSETS_BASE__) || appBase;

export function resolveAsset(path: string): string {
  if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) {
    return path;
  }
  return assetsBase.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
}

export function resolveBase(path: string): string {
  return appPrefix + path;
}
