import { computed, ref } from "vue";

import { processException, useWallet } from "@matterlabs/composables";
import { ethers } from "ethers";
import * as zkSyncSdk from "zksync-web3";

import useContext from "@/composables/useContext";

import type { AbiFragment } from "./useAddress";
import type { WalletError } from "@matterlabs/composables";

export default (context = useContext()) => {
  const walletContext = {
    isReady: context.isReady,
    currentNetwork: computed(() => {
      return {
        ...context.currentNetwork.value,
        explorerUrl: context.currentNetwork.value.rpcUrl,
        chainName: context.currentNetwork.value.l2NetworkName,
        l1ChainId: null as unknown as number,
      };
    }),
    networks: context.networks,
    getL2Provider: () => null as unknown as zkSyncSdk.Provider,
  };

  const { connect: connectWallet, getL2Signer, address: walletAddress, isMetamaskInstalled } = useWallet(walletContext);
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const response = ref<{ message?: string; transactionHash?: string } | undefined>(undefined);
  const errorMessage = ref<WalletError | null>(null);

  const writeFunction = async (
    address: string,
    abiFragment: AbiFragment,
    params: Record<string, string | string[] | boolean | boolean[]>
  ) => {
    try {
      isRequestPending.value = true;
      isRequestFailed.value = false;
      response.value = undefined;
      errorMessage.value = null;
      const signer = await getL2Signer();
      const contract = new ethers.Contract(address, [abiFragment], signer!);
      const method = contract[abiFragment.name];
      const methodArguments = Object.entries(params)
        .filter(([key]) => key !== "value")
        .map(([, inputValue]) => {
          if (inputValue === "true") {
            inputValue = true;
          } else if (inputValue === "false") {
            inputValue = false;
          }
          return inputValue;
        });
      const methodOptions = {
        value: ethers.utils.parseEther((params.value as string) ?? "0"),
        gasLimit: "10000000",
      };
      const res = await method(
        ...[
          ...(methodArguments.length ? methodArguments : []),
          abiFragment.stateMutability === "payable" ? methodOptions : undefined,
        ].filter((e) => e !== undefined)
      ).catch(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) => processException(e, "Please, try again later")
      );
      response.value = { transactionHash: res.hash };
    } catch (e) {
      isRequestFailed.value = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorMessage.value = (e as any)?.message;
    } finally {
      isRequestPending.value = false;
    }
  };

  const readFunction = async (
    address: string,
    abiFragment: AbiFragment,
    params: Record<string, string | string[] | boolean | boolean[]>
  ) => {
    try {
      isRequestPending.value = true;
      isRequestFailed.value = false;
      response.value = undefined;
      errorMessage.value = null;
      let signer: zkSyncSdk.Provider | zkSyncSdk.Signer = new zkSyncSdk.Provider(context.currentNetwork.value.rpcUrl);
      if (walletAddress.value !== null) {
        // If connected to a wallet, use the signer so 'msg.sender' is correctly populated downstream
        signer = await getL2Signer();
      }
      const contract = new ethers.Contract(address, [abiFragment], signer!);
      const res = (
        await contract[abiFragment.name](...Object.entries(params).map(([, inputValue]) => inputValue)).catch(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e: any) => processException(e, "Please, try again later")
        )
      )?.toString();
      response.value = { message: res };
    } catch (e) {
      isRequestFailed.value = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorMessage.value = (e as any)?.message;
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    isRequestFailed,
    isRequestPending,
    response,
    errorMessage,
    isMetamaskInstalled,
    isWalletConnected: computed(() => !!walletAddress.value),
    connectWallet,
    writeFunction,
    readFunction,
  };
};
