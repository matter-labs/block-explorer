import { describe, expect, it, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import useSearch from "@/composables/useSearch";

import * as validators from "@/utils/validators";

const router = {
  push: vi.fn(),
};

vi.mock("vue-router", () => ({
  useRouter: () => router,
}));

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => ({})),
  };
});

describe("UseSearch:", () => {
  it("creates useSearch composable", () => {
    const result = useSearch();
    expect(result.isRequestPending).toBeDefined();
    expect(result.isRequestFailed).toBeDefined();
    expect(result.search).toBeDefined();
    expect(result.getSearchRoute).toBeDefined();
  });

  describe("getSearchRoute", () => {
    it("returns search route for the address param", () => {
      const { getSearchRoute } = useSearch();
      const searchRoute = getSearchRoute("0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3");
      expect(searchRoute!.apiRoute).toBe("address");
      expect(searchRoute!.routeName).toBe("address");
      expect(searchRoute!.routeParam).toEqual({
        address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3",
      });
    });

    it("returns search route for the transaction hash param", () => {
      const { getSearchRoute } = useSearch();
      const searchRoute = getSearchRoute("0xce8225eb5c843ceb1729447c9415bff9bd0fb75ff4263b309a79b03f1c0d50b0");
      expect(searchRoute!.apiRoute).toBe("transactions");
      expect(searchRoute!.routeName).toBe("transaction");
      expect(searchRoute!.routeParam).toEqual({
        hash: "0xce8225eb5c843ceb1729447c9415bff9bd0fb75ff4263b309a79b03f1c0d50b0",
      });
    });

    it("returns search route for batch number param", () => {
      const { getSearchRoute } = useSearch();
      const searchRoute = getSearchRoute("123");
      expect(searchRoute!.apiRoute).toBe("batches");
      expect(searchRoute!.routeName).toBe("batch");
      expect(searchRoute!.routeParam).toEqual({
        id: "123",
      });
    });

    it("returns null in case of an error", () => {
      vi.spyOn(validators, "isAddress").mockImplementationOnce(() => {
        throw new Error("invalid address");
      });
      const { getSearchRoute } = useSearch();
      const searchRoute = getSearchRoute("123");
      expect(searchRoute).toBeNull();
    });
  });

  describe("search", () => {
    it("sets routerName and param to router push function when param is address", async () => {
      const result = useSearch();
      await result.search("0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3");
      expect(router.push).toHaveBeenCalledWith({
        name: "address",
        params: { address: "0xc2675ae7f35b7d85ed1e828ccf6d0376b01adea3" },
      });
    });
    it("sets routerName and param to router push function when param is contract address", async () => {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const mock = ($fetch as any).mockResolvedValue({ accountType: "contract" });
      const result = useSearch();
      await result.search("0xca063a2ab07491ee991dcecb456d1265f842b568");

      expect(router.push).toHaveBeenCalledWith({
        name: "address",
        params: { address: "0xca063a2ab07491ee991dcecb456d1265f842b568" },
      });
      mock.mockRestore();
    });
    it("sets routerName and param to router push function when param is batch id", async () => {
      const result = useSearch();
      await result.search("4123");
      expect(router.push).toHaveBeenCalledWith({
        name: "batch",
        params: { id: "4123" },
      });
    });
    it("sets routerName and param to router push function when param is transaction hash", async () => {
      const result = useSearch();
      await result.search("0xce8225eb5c843ceb1729447c9415bff9bd0fb75ff4263b309a79b03f1c0d50b0");
      expect(router.push).toHaveBeenCalledWith({
        name: "transaction",
        params: { hash: "0xce8225eb5c843ceb1729447c9415bff9bd0fb75ff4263b309a79b03f1c0d50b0" },
      });
    });
    it("sets routerName and param to router push function when param is transaction hash", async () => {
      const result = useSearch();
      await result.search("6547236587245bjhkbf54");
      expect(router.push).toHaveBeenCalledWith({
        name: "transaction",
        params: { hash: "0xce8225eb5c843ceb1729447c9415bff9bd0fb75ff4263b309a79b03f1c0d50b0" },
      });
    });
  });
});
