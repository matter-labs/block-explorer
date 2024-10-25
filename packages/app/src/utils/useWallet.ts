import { reactive, toRefs, unref } from "vue";

import detectEthereumProvider from "@metamask/detect-provider";
import { useStorage } from "@vueuse/core";
import { ethers } from "ethers";
import * as zkSyncSdk from "zksync-web3";

import defaultLogger from "./logger";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processException(e: any, message: string) {
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
const state = reactive({
  isReady: false,
  isMetamaskInstalled: false,
  isConnectPending: false,
  isConnectFailed: false,
  address: null,
});
export const isAuthenticated = useStorage("useWallet_isAuthenticated", false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (context: any, logger = defaultLogger) => {
  const getEthereumProvider = () =>
    detectEthereumProvider({
      mustBeMetaMask: true,
      silent: false,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAccountsChanged = (accounts: any) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (provider as any)
        .request({ method: "eth_accounts" })
        .then(handleAccountsChanged)
        .catch((e: Error) => logger.error(e))
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (ethereumProvider as any).request({ method: "eth_requestAccounts" }).then(handleAccountsChanged);
    } catch (e) {
      logger.error(e);
      state.isConnectFailed = true;
    } finally {
      state.isConnectPending = false;
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const switchNetwork = async (targetChainId: number, ethereumProvider: any) => {
    const currentNetwork = unref(context.currentNetwork);
    const chainId = "0x" + targetChainId.toString(16);
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
        if ((switchError as any).code !== 4902 && (switchError as any).data?.originalError?.code !== 4902) {
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
                chainId: `0x${currentNetwork.l2ChainId.toString(16)}`,
                chainName: currentNetwork.chainName,
                nativeCurrency: {
                  name: "Sophon",
                  symbol: "SOPH",
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!addError || (addError as any).code !== 4001) {
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
    const provider = new ethers.providers.Web3Provider(ethereum);
    return zkSyncSdk.L1Signer.from(provider.getSigner(), context.getL2Provider());
  };
  const getL2Signer = async () => {
    const ethereum = await getEthereumProvider();
    if (!ethereum || !(await switchNetwork(context.currentNetwork.value.l2ChainId, ethereum))) {
      throw WalletError.NetworkChangeRejected();
    }
    const provider = new zkSyncSdk.Web3Provider(ethereum);
    return provider.getSigner();
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
  messageCode;
  constructor(message: string, messageCode: string) {
    super(message);
    this.messageCode = messageCode;
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
  static UnknownError(message = "Unknown error occurred") {
    return new WalletError(message, "unknown_error_occurred");
  }
}
