import { createRouter } from "vue-router";

import { afterEach, describe, expect, it } from "vitest";

import { createAppHistory } from "@/router/history";

const routes = [
  { path: "/", name: "home", component: { template: "<div>Home</div>" } },
  { path: "/tx/:hash", name: "transaction", component: { template: "<div>Transaction</div>" } },
];

describe("createAppHistory", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  describe("when app base is a custom path", () => {
    const base = "/explorer/";

    it("shows the root route without a trailing slash", async () => {
      const router = createRouter({ history: createAppHistory(base), routes });
      await router.push("/");
      expect(window.location.pathname).toBe("/explorer");
    });

    it("keeps query params of the root route", async () => {
      const router = createRouter({ history: createAppHistory(base), routes });
      await router.push({ path: "/", query: { network: "local" } });
      expect(window.location.pathname).toBe("/explorer");
      expect(window.location.search).toBe("?network=local");
    });

    it("keeps nested routes under the base", async () => {
      const router = createRouter({ history: createAppHistory(base), routes });
      await router.push("/tx/0x1");
      expect(window.location.pathname).toBe("/explorer/tx/0x1");
    });

    it("creates root links without a trailing slash", () => {
      const router = createRouter({ history: createAppHistory(base), routes });
      expect(router.resolve({ name: "home" }).href).toBe("/explorer");
      expect(router.resolve({ name: "transaction", params: { hash: "0x1" } }).href).toBe("/explorer/tx/0x1");
    });

    it("resolves both base forms to the root route", async () => {
      for (const path of ["/explorer", "/explorer/"]) {
        window.history.replaceState(null, "", path);
        const router = createRouter({ history: createAppHistory(base), routes });
        await router.push(router.options.history.location);
        expect(router.currentRoute.value.name).toBe("home");
      }
    });
  });

  describe("when app base is the root", () => {
    it("keeps the root route as is", async () => {
      const router = createRouter({ history: createAppHistory("/"), routes });
      await router.push("/");
      expect(window.location.pathname).toBe("/");
      expect(router.resolve({ name: "home" }).href).toBe("/");
    });
  });
});
