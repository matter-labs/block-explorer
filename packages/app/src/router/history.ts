import { createWebHistory, type RouterHistory } from "vue-router";

// Matches the root path, alone or followed by a query or hash: "/", "/?a=b", "/#c".
const ROOT_PATH_REGEX = /^\/(?=[?#]|$)/;

// Vue Router builds URLs as `base + path`, so under a custom base (e.g. "/explorer/") the root route
// becomes "/explorer/". Drop the root path's slash so the address bar and links show "/explorer".
// "/explorer/" keeps working: Vue Router reads both forms as the root route.
export function createAppHistory(base: string): RouterHistory {
  const history = createWebHistory(base);
  if (base === "/") {
    return history;
  }

  const withoutRootSlash = (location: string) => location.replace(ROOT_PATH_REGEX, "");
  const { push, replace, createHref } = history;
  history.push = (to, data) => push(withoutRootSlash(to), data);
  history.replace = (to, data) => replace(withoutRootSlash(to), data);
  history.createHref = (location) => createHref(withoutRootSlash(location));
  return history;
}
