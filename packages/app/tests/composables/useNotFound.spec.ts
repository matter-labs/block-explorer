import { ref } from "vue";

import { describe, expect, it, vi } from "vitest";

import useNotFound from "@/composables/useNotFound";

const notFoundRoute = { name: "not-found", meta: { title: "404 Not Found" } };
const router = {
  resolve: vi.fn(() => notFoundRoute),
  replace: vi.fn(),
  currentRoute: {
    value: {},
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
    composable.setNotFoundView();
    expect(router.replace).toHaveBeenCalledWith(notFoundRoute);
    router.replace.mockReset();
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
