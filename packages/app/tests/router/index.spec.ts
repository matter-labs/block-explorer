import { ref } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserContext } from "@/composables/useContext";

// Mock useRuntimeConfig
const mockAppEnvironment = vi.fn(() => "default");
vi.mock("@/composables/useRuntimeConfig", () => ({
  default: () => ({
    appEnvironment: mockAppEnvironment(),
  }),
}));

// Mock useContext
const mockUser = ref<UserContext>({ loggedIn: false });
vi.mock("@/composables/useContext", () => ({
  default: () => ({
    user: mockUser,
  }),
}));

describe("Router Navigation Guard", () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    // Reset mocks
    mockAppEnvironment.mockReturnValue("default");
    mockUser.value = { loggedIn: false };

    // Create router with test routes
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "home", component: { template: "<div>Home</div>" } },
        {
          path: "/contracts/verify",
          name: "contract-verification",
          component: { template: "<div>Contract Verification</div>" },
          meta: { requiresAdmin: true },
        },
        {
          path: "/not-authorized",
          name: "not-authorized",
          component: { template: "<div>Not Authorized</div>" },
        },
        {
          path: "/public",
          name: "public-page",
          component: { template: "<div>Public</div>" },
        },
      ],
    });

    // Apply the same guard logic as in the actual router
    router.beforeEach((to) => {
      const isPrividium = mockAppEnvironment() === "prividium";

      if (isPrividium && to.meta.requiresAdmin) {
        const isAdmin = mockUser.value.loggedIn && mockUser.value.roles?.includes("admin");
        if (!isAdmin) {
          return { name: "not-authorized" };
        }
      }
    });
  });

  describe("in non-prividium mode", () => {
    beforeEach(() => {
      mockAppEnvironment.mockReturnValue("default");
    });

    it("allows access to requiresAdmin routes without authentication", async () => {
      await router.push("/contracts/verify");
      expect(router.currentRoute.value.name).toBe("contract-verification");
    });

    it("allows access to public routes", async () => {
      await router.push("/public");
      expect(router.currentRoute.value.name).toBe("public-page");
    });
  });

  describe("in prividium mode", () => {
    beforeEach(() => {
      mockAppEnvironment.mockReturnValue("prividium");
    });

    it("redirects unauthenticated users from requiresAdmin routes to not-authorized", async () => {
      mockUser.value = { loggedIn: false };

      await router.push("/contracts/verify");
      expect(router.currentRoute.value.name).toBe("not-authorized");
    });

    it("redirects authenticated non-admin users from requiresAdmin routes to not-authorized", async () => {
      mockUser.value = {
        loggedIn: true,
        address: "0x123",
        wallets: ["0x123"],
        roles: ["user"],
      };

      await router.push("/contracts/verify");
      expect(router.currentRoute.value.name).toBe("not-authorized");
    });

    it("allows admin users to access requiresAdmin routes", async () => {
      mockUser.value = {
        loggedIn: true,
        address: "0x123",
        wallets: ["0x123"],
        roles: ["admin"],
      };

      await router.push("/contracts/verify");
      expect(router.currentRoute.value.name).toBe("contract-verification");
    });

    it("allows unauthenticated users to access public routes", async () => {
      mockUser.value = { loggedIn: false };

      await router.push("/public");
      expect(router.currentRoute.value.name).toBe("public-page");
    });

    it("allows non-admin users to access public routes", async () => {
      mockUser.value = {
        loggedIn: true,
        address: "0x123",
        wallets: ["0x123"],
        roles: ["user"],
      };

      await router.push("/public");
      expect(router.currentRoute.value.name).toBe("public-page");
    });
  });
});
