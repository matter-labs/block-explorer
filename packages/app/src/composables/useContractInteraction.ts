import { computed, ref } from "vue";

import { Contract, JsonRpcProvider, parseEther } from "ethers";

import useContext from "@/composables/useContext";
import { processException, default as useWallet, type WalletError } from "@/composables/useWallet";

import type { AbiFragment } from "./useAddress";
import type { AbstractSigner } from "ethers";

export const PAYABLE_AMOUNT_PARAM_NAME = "payable_function_payable_amount";

type ContractError = WalletError & {
  messageCode: "CONTRACT_EXECUTION_REVERTED" | "CONTRACT_OPERATION_FAILED";
};

const createContractError = (messageCode: ContractError["messageCode"], message: string): ContractError => ({
  messageCode,
  name: messageCode,
  message,
});

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
    getL2Provider: () => context.getL2Provider(),
  };

  const { connect: connectWallet, getL2Signer, address: walletAddress, isMetamaskInstalled } = useWallet(walletContext);
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const response = ref<{ message?: string; transactionHash?: string } | undefined>(undefined);
  const errorMessage = ref<ContractError | WalletError | null>(null);

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
      const contract = new Contract(address, [abiFragment], signer!);
      const method = contract[abiFragment.name];
      const abiFragmentNames = abiFragment.inputs.map((abiInput) => abiInput.name);
      const methodArguments = abiFragmentNames.map((abiFragmentName) => {
        if (params[abiFragmentName] === "true") {
          return true;
        }
        if (params[abiFragmentName] === "false") {
          return false;
        }
        return params[abiFragmentName];
      });
      const valueMethodOption = {
        value: parseEther((params[PAYABLE_AMOUNT_PARAM_NAME] as string) ?? "0"),
      };
      const res = await method(
        ...[
          ...(methodArguments.length ? methodArguments : []),
          {
            ...{ from: await signer.getAddress(), type: 0 },
            ...(abiFragment.stateMutability === "payable" ? valueMethodOption : undefined),
          },
        ].filter((e) => e !== undefined)
      ).catch(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) => processException(e, "Please, try again later")
      );
      response.value = { transactionHash: res.hash };
    } catch (e) {
      isRequestFailed.value = true;
      if (context.currentNetwork.value.prividium) {
        const error = e as Error;
        if (error?.message?.includes("execution reverted")) {
          errorMessage.value = createContractError("CONTRACT_EXECUTION_REVERTED", error.message);
        } else {
          errorMessage.value = createContractError(
            "CONTRACT_OPERATION_FAILED",
            "You might not be authorized to execute this operation"
          );
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorMessage.value = (e as any)?.message;
      }
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

      let signer: JsonRpcProvider | AbstractSigner;
      if (walletAddress.value === null) {
        signer = new JsonRpcProvider(context.currentNetwork.value.rpcUrl, context.currentNetwork.value.l2ChainId, {
          staticNetwork: true,
        });
      } else {
        signer = await getL2Signer();
      }

      const contract = new Contract(address, [abiFragment], signer!);
      const res = (
        await contract[abiFragment.name](...Object.entries(params).map(([, inputValue]) => inputValue)).catch(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e: any) => processException(e, "Please, try again later")
        )
      )?.toString();
      response.value = { message: res };
    } catch (e) {
      isRequestFailed.value = true;
      if (context.currentNetwork.value.prividium) {
        const error = e as Error;
        if (error?.message?.includes("execution reverted")) {
          errorMessage.value = createContractError("CONTRACT_EXECUTION_REVERTED", error.message);
        } else {
          errorMessage.value = createContractError(
            "CONTRACT_OPERATION_FAILED",
            "You might not be authorized to execute this operation"
          );
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorMessage.value = (e as any)?.message;
      }
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
