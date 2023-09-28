import { ref } from "vue";

import { $fetch, FetchError } from "ohmyfetch";

import useContext from "@/composables/useContext";

import {
  type Compiler,
  CompilerEnum,
  ContractVerificationCodeFormatEnum,
  type ContractVerificationData,
  type ContractVerificationStatus,
} from "@/types";

type CompilerState = {
  name: Compiler;
  isRequestPending: boolean;
  isRequestFailed: boolean;
  versions: string[];
};

type ContractVerificationStatusResponse = {
  status: ContractVerificationStatus;
  error?: string;
  compilationErrors?: string[];
};

class ContractVerificationError extends Error {
  constructor(message: string, public readonly response: ContractVerificationStatusResponse) {
    super(message);

    Object.setPrototypeOf(this, ContractVerificationError.prototype);
  }
}

export default (context = useContext()) => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const contractVerificationErrorMessage = ref<string | null>(null);
  const compilationErrors = ref<string[]>([]);
  const compilerVersions = ref<Record<Compiler, CompilerState>>(
    Object.values(CompilerEnum).reduce((acc: Record<string, CompilerState>, compiler: Compiler) => {
      acc[compiler] = {
        name: compiler,
        isRequestPending: false,
        isRequestFailed: false,
        versions: [],
      };
      return acc;
    }, {})
  );
  const contractVerificationStatus = ref<null | ContractVerificationStatus>(null);

  const getStatusById = async (id: number): Promise<ContractVerificationStatus> => {
    const response: {
      status: ContractVerificationStatus;
      error?: string;
    } = await $fetch(`${context.currentNetwork.value.verificationApiUrl}/contract_verification/${id}`);
    if (response.error) {
      throw new ContractVerificationError(response.error, response);
    }
    return response.status;
  };

  const waitForVerification = async (id: number): Promise<ContractVerificationStatus> => {
    const status = await getStatusById(id);
    contractVerificationStatus.value = status;
    if (status !== "failed" && status !== "successful") {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(undefined);
        }, 2500);
      });
      await waitForVerification(id);
    }
    return status;
  };

  const requestVerification = async (data: ContractVerificationData) => {
    isRequestPending.value = true;
    isRequestFailed.value = false;
    contractVerificationErrorMessage.value = null;
    compilationErrors.value = [];
    try {
      const isSolidityContract = [
        ContractVerificationCodeFormatEnum.soliditySingleFile,
        ContractVerificationCodeFormatEnum.solidityMultiPart,
      ].includes(data.codeFormat);

      const { sourceCode, zkCompilerVersion, compilerVersion, ...payload } = data;
      const response = await $fetch(`${context.currentNetwork.value.verificationApiUrl}/contract_verification`, {
        method: "POST",
        body: {
          ...payload,
          ...(isSolidityContract && {
            sourceCode,
            compilerZksolcVersion: zkCompilerVersion,
            compilerSolcVersion: compilerVersion,
          }),
          ...(!isSolidityContract && {
            ...(typeof sourceCode === "string" && {
              sourceCode: {
                [payload.contractName]: sourceCode,
              },
            }),
            ...(typeof sourceCode !== "string" && {
              sourceCode: Object.keys(sourceCode.sources).reduce((acc: Record<string, string>, filename: string) => {
                acc[filename.replace(".vy", "")] = sourceCode.sources[filename].content;
                return acc;
              }, {}),
            }),
            compilerZkvyperVersion: zkCompilerVersion,
            compilerVyperVersion: compilerVersion,
          }),
          constructorArguments: data.constructorArguments ? data.constructorArguments : undefined,
        },
      });
      if (typeof response === "number") {
        await waitForVerification(response);
      }
    } catch (error: unknown) {
      isRequestFailed.value = true;
      if (error instanceof FetchError) {
        contractVerificationErrorMessage.value = error.data ?? error.message;
      } else if (error instanceof ContractVerificationError) {
        contractVerificationErrorMessage.value = error.message;
        compilationErrors.value = error.response.compilationErrors ?? [];
      }
    } finally {
      isRequestPending.value = false;
    }
  };

  const requestCompilerVersions = async (compiler: Compiler) => {
    compilerVersions.value[compiler].isRequestPending = true;
    compilerVersions.value[compiler].isRequestFailed = false;
    try {
      const result = await $fetch(
        `${context.currentNetwork.value.verificationApiUrl}/contract_verification/${compiler}_versions`
      );
      compilerVersions.value[compiler].versions = result.sort((a: string, b: string) => {
        return b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" });
      });
    } catch (error: unknown) {
      compilerVersions.value[compiler].isRequestFailed = true;
    } finally {
      compilerVersions.value[compiler].isRequestPending = false;
    }
  };

  return {
    isRequestPending,
    isRequestFailed,
    contractVerificationErrorMessage,
    compilationErrors,
    contractVerificationStatus,
    compilerVersions,
    requestVerification,
    requestCompilerVersions,
  };
};
