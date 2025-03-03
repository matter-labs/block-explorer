import { computed } from "vue";

import { afterEach, describe, expect, it, vi } from "vitest";

import { Provider } from "zksync-ethers";

import useWallet, { isAuthenticated, WalletError } from "@/composables/useWallet";

import type { NetworkConfiguration } from "@/composables/useWallet";
import type { ComputedRef } from "vue";

import { numberToHexString } from "@/utils/formatters";

let mockDetect: null | (() => unknown) = null;

const mockProvider = {
  chainId: "0x0",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async request<T>(args: { method: string; params: unknown[] }): Promise<T> {
    if (args.method === "eth_chainId") {
      return "0x0" as unknown as T;
    }
    if (args.method === "eth_accounts") {
      return ["0x000000000000000000000000000000000000800A"] as unknown as T;
    }

    return null as unknown as T;
  },
  on() {
    return;
  },
};

const currentNetwork = {
  l1ChainId: 5,
  l2ChainId: 280,
  explorerUrl: "https://zksync2-testnet.zkscan.io",
  rpcUrl: "https://zksync2-testnet.zksync.dev",
  chainName: "Goerli",
};

vi.mock("@metamask/detect-provider", () => ({
  default: async () => {
    if (mockDetect) {
      return mockDetect();
    }

    return mockProvider;
  },
}));

const defaultContext: {
  currentNetwork: ComputedRef<NetworkConfiguration>;
  getL2Provider: () => Provider;
} = {
  currentNetwork: computed(() => currentNetwork),
  getL2Provider() {
    return new Provider(currentNetwork.rpcUrl);
  },
};

describe("useWallet:", () => {
  it("creates wallet composable", () => {
    const result = useWallet(defaultContext);
    expect(result.address).toBeDefined();
    expect(result.isConnectPending).toBeDefined();
    expect(result.isConnectFailed).toBeDefined();
    expect(result.isMetamaskInstalled).toBeDefined();
    expect(result.isReady).toBeDefined();
    expect(result.getL1Signer).toBeDefined();
    expect(result.getL2Signer).toBeDefined();
    expect(result.connect).toBeDefined();
    expect(result.disconnect).toBeDefined();
  });

  describe("connect", () => {
    it("sets isConnectPending to true", () => {
      const result = useWallet(defaultContext);

      result.connect();
      expect(result.isConnectPending.value).toEqual(true);
    });

    it("sets isConnectFailed to false", () => {
      const result = useWallet(defaultContext);

      result.connect();
      expect(result.isConnectFailed.value).toEqual(false);
    });

    it("sets isConnectPending to false / isConnectFailed to true when failed to request 'eth_requestAccounts'", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockRejectedValue(new Error());

      const result = useWallet(defaultContext);

      await result.connect();
      expect(result.isConnectPending.value).toEqual(false);
      expect(result.isConnectFailed.value).toEqual(true);
      mockRequest.mockRestore();
    });

    it("sets an address when request 'eth_requestAccounts' completed", async () => {
      const mockRequest = vi
        .spyOn(mockProvider, "request")
        .mockResolvedValue(["0x481e48ce19781c3ca573967216dee75fdcf70f54"]);

      const result = useWallet(defaultContext);
      await result.connect();

      expect(result.address.value).toEqual("0x481e48ce19781c3ca573967216dee75fdcf70f54");
      mockRequest.mockRestore();
    });

    it("sets isConnectPending to false / isConnectFailed to false when request 'eth_requestAccounts' completed", async () => {
      const mockRequest = vi
        .spyOn(mockProvider, "request")
        .mockResolvedValue(["0x481e48ce19781c3ca573967216dee75fdcf70f54"]);

      const result = useWallet(defaultContext);

      await result.connect();
      expect(result.isConnectPending.value).toEqual(false);
      expect(result.isConnectFailed.value).toEqual(false);
      mockRequest.mockRestore();
    });

    it("sets isAuthenticated to true to local storage", async () => {
      isAuthenticated.value = false;

      const mockRequest = vi
        .spyOn(mockProvider, "request")
        .mockResolvedValue(["0x481e48ce19781c3ca573967216dee75fdcf70f54"]);

      const result = useWallet(defaultContext);
      await result.connect();

      expect(isAuthenticated.value).toEqual(true);
      mockRequest.mockRestore();
    });
  });

  describe("disconnect", () => {
    it("sets an address to null", async () => {
      const mockRequest = vi
        .spyOn(mockProvider, "request")
        .mockResolvedValue(["0x481e48ce19781c3ca573967216dee75fdcf70f54"]);

      const result = useWallet(defaultContext);

      await result.connect();
      result.disconnect();

      expect(result.address.value).toEqual(null);
      mockRequest.mockRestore();
    });

    it("sets isAuthenticated to false", async () => {
      const mockRequest = vi
        .spyOn(mockProvider, "request")
        .mockResolvedValue(["0x481e48ce19781c3ca573967216dee75fdcf70f54"]);
      isAuthenticated.value = true;

      const result = useWallet(defaultContext);

      result.disconnect();

      expect(isAuthenticated.value).toEqual(false);
      mockRequest.mockRestore();
    });
  });

  describe("initialize", () => {
    afterEach(() => {
      mockDetect = null;
    });
    it("sets isReady to true / isMetamaskInstalled to false when failed to get ethereum provider", async () => {
      mockDetect = () => {
        throw new Error();
      };
      const result = useWallet(defaultContext);

      await result.initialize();
      expect(result.isReady.value).toEqual(true);
      expect(result.isMetamaskInstalled.value).toEqual(false);
    });

    it("sets isReady to true / isMetamaskInstalled to false when ethereum provider is null", async () => {
      mockDetect = () => null;
      const result = useWallet(defaultContext);

      await result.initialize();
      expect(result.isReady.value).toEqual(true);
      expect(result.isMetamaskInstalled.value).toEqual(false);
    });

    it("sets isMetamaskInstalled to true", async () => {
      const result = useWallet(defaultContext);

      await result.initialize();
      expect(result.isMetamaskInstalled.value).toEqual(true);
    });

    it('sets an address when request "eth_accounts" completed', async () => {
      const mockRequest = vi
        .spyOn(mockProvider, "request")
        .mockResolvedValue(["0x481e48ce19781c3ca573967216dee75fdcf70f54"]);
      isAuthenticated.value = true;

      const result = useWallet(defaultContext);

      await result.initialize();

      expect(result.address.value).toEqual("0x481e48ce19781c3ca573967216dee75fdcf70f54");
      mockRequest.mockRestore();
    });

    it('sets isReady to true when request "eth_accounts" completed', async () => {
      const mockRequest = vi
        .spyOn(mockProvider, "request")
        .mockResolvedValue(["0x481e48ce19781c3ca573967216dee75fdcf70f54"]);

      const result = useWallet(defaultContext);

      await result.initialize();
      expect(result.isReady.value).toEqual(true);
      mockRequest.mockRestore();
    });

    it('sets an address to null when request "eth_accounts" resolved with an empty array', async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockResolvedValue([]);

      const result = useWallet(defaultContext);

      await result.initialize();
      expect(result.address.value).toEqual(null);
      mockRequest.mockRestore();
    });

    it('sets an address to null when request "eth_accounts" failed', async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockRejectedValue(new Error());

      const result = useWallet(defaultContext);

      await result.initialize();
      expect(result.address.value).toEqual(null);
      mockRequest.mockRestore();
    });

    it('sets isReady to true when request "eth_accounts" failed', async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockRejectedValue(new Error());

      const result = useWallet(defaultContext);

      await result.initialize();
      expect(result.isReady.value).toEqual(true);
      mockRequest.mockRestore();
    });

    it("sets an address to null / isReady to true when isAuthenticated is false", async () => {
      const mockRequest = vi
        .spyOn(mockProvider, "request")
        .mockResolvedValue(["0x481e48ce19781c3ca573967216dee75fdcf70f54"]);
      isAuthenticated.value = false;

      const result = useWallet(defaultContext);
      await result.initialize();

      expect(result.isReady.value).toEqual(true);
      expect(result.address.value).toEqual(null);
      mockRequest.mockRestore();
    });
  });

  describe("getL1Signer", () => {
    const l1ChainId = numberToHexString(defaultContext.currentNetwork.value.l1ChainId);
    const l2ChainId = numberToHexString(defaultContext.currentNetwork.value.l2ChainId);

    it("returns L1 signer", async () => {
      const result = useWallet(defaultContext);

      const signer = await result.getL1Signer();
      expect(signer).toBeDefined();
    });

    it("switches network to L1 when it is not selected yet", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request");
      mockProvider.chainId = l2ChainId;
      const result = useWallet(defaultContext);

      await result.getL1Signer();

      expect(mockRequest).toHaveBeenCalledWith({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: l1ChainId }],
      });
      mockRequest.mockRestore();
    });

    it("does not attempt to add L1 when it is not added yet", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockImplementation(async (args) => {
        if (args?.method === "wallet_switchEthereumChain") {
          throw { code: 4902, message: "" };
        }
      });
      mockProvider.chainId = l2ChainId;

      const result = useWallet(defaultContext);

      await expect(result.getL1Signer()).rejects.toEqual(WalletError.NetworkChangeRejected());
      expect(mockRequest).toHaveBeenCalledTimes(1);
      mockRequest.mockRestore();
    });

    it("does not make a switch to L1 network request when it is already selected", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request");
      mockProvider.chainId = l1ChainId;
      const result = useWallet(defaultContext);

      await result.getL1Signer();

      expect(mockRequest).not.toHaveBeenCalledWith(
        expect.objectContaining({
          method: "wallet_switchEthereumChain",
          params: expect.any(Array),
        })
      );
      mockRequest.mockRestore();
    });

    it("throws an error when failed to switch network", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockRejectedValue(new Error());
      mockProvider.chainId = l2ChainId;
      const result = useWallet(defaultContext);

      await expect(result.getL1Signer()).rejects.toEqual(WalletError.NetworkChangeRejected());
      mockRequest.mockRestore();
    });
  });

  describe("getL2Signer", () => {
    const l1ChainId = numberToHexString(defaultContext.currentNetwork.value.l1ChainId);
    const l2ChainId = numberToHexString(defaultContext.currentNetwork.value.l2ChainId);

    it("returns L2 signer", async () => {
      const result = useWallet(defaultContext);

      const signer = await result.getL2Signer();
      expect(signer).toBeDefined();
    });

    it("switches network to L2 when it is not selected yet", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request");
      mockProvider.chainId = l1ChainId;
      const result = useWallet(defaultContext);

      await result.getL2Signer();

      expect(mockRequest).toHaveBeenCalledWith({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: l2ChainId }],
      });
      mockRequest.mockRestore();
    });

    it("adds network L2 when it is not added yet", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockImplementation(async (args) => {
        if (args?.method === "wallet_switchEthereumChain") {
          throw { code: 4902, message: "" };
        }
        if (args.method === "eth_chainId") {
          return "0x0";
        }
        if (args.method === "eth_accounts") {
          return ["0x000000000000000000000000000000000000800A"];
        }

        return null;
      });
      mockProvider.chainId = l1ChainId;

      const result = useWallet(defaultContext);

      await result.getL2Signer();

      expect(mockRequest).toHaveBeenCalledWith({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: l2ChainId,
            chainName: `${currentNetwork.chainName}`,
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [currentNetwork.rpcUrl],
            blockExplorerUrls: [currentNetwork.explorerUrl],
            iconUrls: ["https://zksync.io/favicon.ico"],
          },
        ],
      });
      mockRequest.mockRestore();
    });

    it("adds network L2 on phone when it is not added yet", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockImplementation(async (args) => {
        if (args?.method === "wallet_switchEthereumChain") {
          throw {
            data: {
              originalError: {
                code: 4902,
                message: "",
              },
            },
          };
        }
        if (args.method === "eth_chainId") {
          return "0x0";
        }
        if (args.method === "eth_accounts") {
          return ["0x000000000000000000000000000000000000800A"];
        }

        return null;
      });
      mockProvider.chainId = l1ChainId;

      const result = useWallet(defaultContext);

      await result.getL2Signer();

      expect(mockRequest).toHaveBeenCalledWith({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: l2ChainId,
            chainName: `${currentNetwork.chainName}`,
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [currentNetwork.rpcUrl],
            blockExplorerUrls: [currentNetwork.explorerUrl],
            iconUrls: ["https://zksync.io/favicon.ico"],
          },
        ],
      });
      mockRequest.mockRestore();
    });

    it("does not make a switch to L2 network request when it is already selected", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request");
      mockProvider.chainId = l2ChainId;
      const result = useWallet(defaultContext);

      await result.getL2Signer();

      expect(mockRequest).not.toHaveBeenCalledWith(
        expect.objectContaining({
          method: "wallet_switchEthereumChain",
          params: expect.any(Array),
        })
      );
      mockRequest.mockRestore();
    });

    it("throws an error when failed to switch to added network", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockImplementation(async () => {
        throw new Error();
      });
      mockProvider.chainId = l1ChainId;

      const result = useWallet(defaultContext);

      await expect(result.getL2Signer()).rejects.toEqual(WalletError.NetworkChangeRejected());
      expect(mockRequest).toHaveBeenCalledTimes(1);
      mockRequest.mockRestore();
    });

    it("throws an error when failed to add network", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockImplementation(async (args) => {
        if (args?.method === "wallet_switchEthereumChain") {
          throw { code: 4902, message: "" };
        }

        throw new Error();
      });
      mockProvider.chainId = l1ChainId;

      const result = useWallet(defaultContext);

      await expect(result.getL2Signer()).rejects.toEqual(WalletError.NetworkChangeRejected());

      mockRequest.mockRestore();
    });

    it("throws an error when rejected to add network", async () => {
      const mockRequest = vi.spyOn(mockProvider, "request").mockImplementation(async (args) => {
        if (args?.method === "wallet_switchEthereumChain") {
          throw { code: 4902, message: "" };
        }

        throw { code: 4001, message: "" };
      });
      mockProvider.chainId = l1ChainId;

      const result = useWallet(defaultContext);

      await expect(result.getL2Signer()).rejects.toEqual(WalletError.NetworkChangeRejected());

      mockRequest.mockRestore();
    });
  });
});
