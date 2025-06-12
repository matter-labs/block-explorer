import { ref } from "vue";

import { FetchError } from "ohmyfetch";

import { FetchInstance } from "./useFetchInstance";

import useContext from "@/composables/useContext";

import {
  type Compiler,
  CompilerEnum,
  ContractVerificationCodeFormatEnum,
  type ContractVerificationData,
  type ContractVerificationStatus,
} from "@/types";
import { getSolcFullVersion, getSolcShortVersion } from "@/utils/solcFullVersions";

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
    } = await FetchInstance.verificationApi(context)(`/contract_verification/${id}`);
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
      const {
        sourceCode,
        zkCompilerVersion,
        evmVersion,
        compilerVersion,
        optimizerRuns,
        isEVM,
        optimizationUsed,
        ...payload
      } = data;

      let sourceCodeVal;

      if (!isSolidityContract && typeof sourceCode === "string") {
        sourceCodeVal = {
          [payload.contractName]: sourceCode,
        };
      } else if (!isSolidityContract && typeof sourceCode !== "string") {
        sourceCodeVal = Object.keys(sourceCode.sources).reduce((acc: Record<string, string>, filename: string) => {
          acc[filename.replace(".vy", "")] = sourceCode.sources[filename].content;
          return acc;
        }, {});
      } else {
        sourceCodeVal = sourceCode;
      }

      let compilerVersionsVal;
      if (isEVM) {
        compilerVersionsVal = {
          evmVersion,
          ...(isSolidityContract
            ? { compilerSolcVersion: getSolcShortVersion(compilerVersion) }
            : { compilerVyperVersion: compilerVersion }),
        };
      } else {
        compilerVersionsVal = {
          ...(isSolidityContract
            ? {
                compilerZksolcVersion: zkCompilerVersion,
                compilerSolcVersion: getSolcShortVersion(compilerVersion),
              }
            : {
                compilerZkvyperVersion: zkCompilerVersion,
                compilerVyperVersion: compilerVersion,
              }),
        };
      }

      const response = await FetchInstance.verificationApi(context)("/contract_verification", {
        method: "POST",
        body: {
          ...payload,
          sourceCode: sourceCodeVal,
          ...compilerVersionsVal,
          ...(isEVM && optimizationUsed ? { optimizerRuns } : {}),
          constructorArguments: data.constructorArguments ? data.constructorArguments : undefined,
          optimizationUsed,
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
      let result;

      if (compiler === CompilerEnum.solc) {
        const solcVersions = await FetchInstance.verificationApi(context)(
          `/contract_verification/${compiler}_versions`
        );
        result = [];
        for (const version of solcVersions) {
          result.push(await getSolcFullVersion(version));
        }
      } else {
        result = await FetchInstance.verificationApi(context)(`/contract_verification/${compiler}_versions`);
      }
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
