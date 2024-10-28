import { reactive, toRefs, unref } from "vue";

import detectEthereumProvider from "@metamask/detect-provider";
import { useStorage } from "@vueuse/core";
import { ethers } from "ethers";
import * as zkSyncSdk from "zksync-web3";

import type { ComputedRef } from "vue";

import defaultLogger from "@/utils/logger";
import { WalletError } from "@/utils/wallet";

export type NetworkConfiguration = {
  l1ChainId: number;
  l2ChainId: number;
  rpcUrl: string;
  explorerUrl: string;
  chainName: string;
};

const state = reactive({
  isReady: false,
  isMetamaskInstalled: false,
  isConnectPending: false,
  isConnectFailed: false,
  address: null,
});

export const isAuthenticated = useStorage("useWallet_isAuthenticated", false);

export const useWallet = (
  context: {
    currentNetwork: ComputedRef<NetworkConfiguration>;
    getL2Provider: () => zkSyncSdk.Provider;
  },
  logger = defaultLogger
) => {
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
    console.log("initialize");
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
    console.log("initialize done");
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
