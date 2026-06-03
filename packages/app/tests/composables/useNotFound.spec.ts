import { ref } from "vue";

import { describe, expect, it, vi } from "vitest";

import useNotFound from "@/composables/useNotFound";

const notFoundRoute = { name: "not-found", meta: { title: "404 Not Found" } };
const router = {
  resolve: vi.fn(() => notFoundRoute),
  replace: vi.fn(),
  currentRoute: {
    value: { fullPath: "/" },
  },
};

vi.mock("vue-router", () => ({
  useRouter: () => router,
}));

describe("UseNotFound:", () => {
  const composable = useNotFound();

  it("creates useNotFound composable", () => {
    expect(composable.useNotFoundView).toBeDefined();
    expect(composable.setNotFoundView).toBeDefined();
  });

  it("sets not found view", async () => {
    await composable.setNotFoundView();
    expect(router.replace).toHaveBeenCalledWith(notFoundRoute);
    router.replace.mockReset();
  });

  it("restores the original URL after replacing the route", async () => {
    const replaceStateSpy = vi.spyOn(history, "replaceState").mockImplementation(() => undefined);
    router.currentRoute.value = { fullPath: "/address/0x123" };
    try {
      await composable.setNotFoundView();
      expect(replaceStateSpy).toHaveBeenCalledWith({}, "404 Not Found", "/address/0x123");
    } finally {
      replaceStateSpy.mockRestore();
      router.currentRoute.value = { fullPath: "/" };
      router.replace.mockReset();
    }
  });

  it("prepends the base path to the restored URL when served from a subpath", async () => {
    const base = document.createElement("base");
    base.setAttribute("href", "/explorer/");
    document.head.appendChild(base);
    const replaceStateSpy = vi.spyOn(history, "replaceState").mockImplementation(() => undefined);
    router.currentRoute.value = { fullPath: "/address/0x123?network=mainnet" };
    try {
      await composable.setNotFoundView();
      expect(replaceStateSpy).toHaveBeenCalledWith({}, "404 Not Found", "/explorer/address/0x123?network=mainnet");
    } finally {
      replaceStateSpy.mockRestore();
      base.remove();
      router.currentRoute.value = { fullPath: "/" };
      router.replace.mockReset();
    }
  });

  it("sets not found view when passed refs are all falsy", async () => {
    const isPending = ref(true);
    const isFailed = ref(false);
    const item = ref(null);
    composable.useNotFoundView(isPending, isFailed, item);
    expect(router.replace).not.toHaveBeenCalled();
    isPending.value = false;
    await new Promise((resolve) => setImmediate(resolve));
    expect(router.replace).toHaveBeenCalled();
    router.replace.mockReset();
  });
});
