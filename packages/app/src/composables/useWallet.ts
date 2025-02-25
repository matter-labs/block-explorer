import { type ComputedRef, reactive, toRefs, type ToRefs, unref } from "vue";

import detectEthereumProvider from "@metamask/detect-provider";
import { type RemovableRef, useStorage } from "@vueuse/core";
import { BrowserProvider } from "ethers";
import { L1Signer, BrowserProvider as L2BrowserProvider, Signer } from "zksync-ethers";

import defaultLogger from "./../utils/logger";

import type { BaseProvider } from "@metamask/providers";
import type { Provider } from "zksync-ethers";

import { numberToHexString } from "@/utils/formatters";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonRpcError = any;

type WalletState = {
  isReady: boolean;
  isConnectPending: boolean;
  isConnectFailed: boolean;
  isMetamaskInstalled: boolean;
  address: string | null;
};

type UseWallet = ToRefs<WalletState> & {
  initialize: () => Promise<void>;

  connect: () => Promise<void>;
  disconnect: () => void;

  getL1Signer: () => Promise<L1Signer>;
  getL2Signer: () => Promise<Signer>;
};

export type NetworkConfiguration = {
  l1ChainId: number;
  l2ChainId: number;
  rpcUrl: string;
  explorerUrl: string;
  chainName: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processException(e: any, message: string): never {
  if (e instanceof WalletError) {
    throw e;
  } else if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
    throw WalletError.TransactionRejected();
  } else if (e?.code === -32603) {
    throw WalletError.JsonRpcError(e?.data?.data?.message?.length ? e.data.data.message : e.message);
  } else if (e?.code === "SERVER_ERROR") {
    throw WalletError.InternalServerError();
  }
  throw WalletError.UnknownError(e?.message?.length ? e.message : message);
}

const state = reactive<WalletState>({
  isReady: false,
  isMetamaskInstalled: false,
  isConnectPending: false,
  isConnectFailed: false,

  address: null,
});

export const isAuthenticated: RemovableRef<boolean> = useStorage<boolean>("useWallet_isAuthenticated", false);

export default (
  context: {
    currentNetwork: ComputedRef<NetworkConfiguration>;
    getL2Provider: () => Provider;
  },
  logger = defaultLogger
): UseWallet => {
  const getEthereumProvider = () =>
    detectEthereumProvider({
      mustBeMetaMask: true,
      silent: false,
    }) as Promise<BaseProvider | undefined>;

  const handleAccountsChanged = (accounts: unknown) => {
    if (Array.isArray(accounts) && accounts.length) {
      state.address = accounts[0];
      isAuthenticated.value = true;
    } else {
      state.address = null;
    }
  };

  const initialize = async () => {
    let provider;
    try {
      provider = await getEthereumProvider();
    } catch (e) {
      logger.error(e);
    }
    if (!provider) {
      state.isReady = true;
      state.isMetamaskInstalled = false;
      return;
    }

    state.isMetamaskInstalled = true;

    if (isAuthenticated.value) {
      await provider
        .request({ method: "eth_accounts" })
        .then(handleAccountsChanged)
        .catch((e) => logger.error(e))
        .then(() => {
          state.isReady = true;
        });
    } else {
      state.isReady = true;
    }

    provider.on("accountsChanged", handleAccountsChanged);
  };

  const connect = async () => {
    try {
      state.isConnectPending = true;
      state.isConnectFailed = false;

      const ethereumProvider = await getEthereumProvider();
      await ethereumProvider!.request({ method: "eth_requestAccounts" }).then(handleAccountsChanged);
    } catch (e) {
      logger.error(e);

      state.isConnectFailed = true;
    } finally {
      state.isConnectPending = false;
    }
  };

  const switchNetwork = async (targetChainId: number, ethereumProvider: BaseProvider): Promise<boolean> => {
    const currentNetwork = unref(context.currentNetwork);
    const chainId = numberToHexString(targetChainId);

    if (ethereumProvider.chainId === chainId) {
      return true;
    }

    try {
      try {
        await ethereumProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainId }],
        });
      } catch (switchError) {
        if (!switchError) {
          throw new Error("Unable to switch network");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((switchError as JsonRpcError).code !== 4902 && (switchError as any).data?.originalError?.code !== 4902) {
          throw switchError;
        }

        if (targetChainId === currentNetwork.l1ChainId) {
          return false;
        }

        try {
          await ethereumProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: numberToHexString(currentNetwork.l2ChainId),
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
          return true;
        } catch (addError) {
          if (!addError || (addError as JsonRpcError).code !== 4001) {
            throw addError;
          }
          return false;
        }
      }

      return true;
    } catch (err) {
      logger.error(err);
      return false;
    }
  };

  const disconnect = () => {
    state.address = null;
    isAuthenticated.value = false;
  };

  const getL1Signer = async () => {
    const ethereum = await getEthereumProvider();

    if (!ethereum || !(await switchNetwork(context.currentNetwork.value.l1ChainId, ethereum))) {
      throw WalletError.NetworkChangeRejected();
    }

    const provider = new BrowserProvider(ethereum);
    return L1Signer.from(await provider.getSigner(), context.getL2Provider()!);
  };

  const getL2Signer = async () => {
    const ethereum = await getEthereumProvider();

    if (!ethereum || !(await switchNetwork(context.currentNetwork.value.l2ChainId, ethereum))) {
      throw WalletError.NetworkChangeRejected();
    }

    const provider = new L2BrowserProvider(ethereum);
    return Signer.from(await provider.getSigner(), context.currentNetwork.value.l2ChainId, context.getL2Provider()!);
  };

  return {
    ...toRefs(state),
    initialize,

    connect,
    disconnect,

    getL1Signer,
    getL2Signer,
  };
};

export class WalletError extends Error {
  constructor(message: string, public readonly messageCode: string) {
    super(message);

    Object.setPrototypeOf(this, WalletError.prototype);
  }

  static NetworkChangeRejected() {
    return new WalletError("Network change rejected", "network_change_rejected");
  }

  static TransactionRejected() {
    return new WalletError("Transaction was rejected", "transaction_rejected");
  }

  static JsonRpcError(message = "JsonRpcError occurred") {
    return new WalletError(message, "json_rpc_error");
  }

  static InternalServerError(message = "Internal Server Error") {
    return new WalletError(message, "internal_server_error");
  }

  static TransactionError(message: string, code: string) {
    return new WalletError(message, code);
  }

  static UnknownError(message = "Unknown error occurred") {
    return new WalletError(message, "unknown_error_occurred");
  }
}
