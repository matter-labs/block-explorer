import { ref } from "vue";

import { FetchError } from "ohmyfetch";

import { FetchInstance } from "./useFetchInstance";

import useContext from "@/composables/useContext";

import { type Compiler, CompilerEnum, type ContractVerificationData, type ContractVerificationStatus } from "@/types";
import { SOLC_FULL_VERSIONS, VYPER_VERSIONS } from "@/utils/constants";

type CompilerState = {
  name: Compiler;
  isRequestPending: boolean;
  isRequestFailed: boolean;
  versions: string[];
};

class ContractVerificationError extends Error {
  constructor(message: string) {
    super(message);
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

  const getStatusById = async (id: string): Promise<{ status: ContractVerificationStatus; result: string }> => {
    const response: {
      result: string;
      status: string;
    } = await FetchInstance.verificationApi(context)(`?module=contract&action=checkverifystatus&guid=${id}`);
    let status: ContractVerificationStatus;
    if (response.status === "0") {
      status = "failed";
    } else {
      status = response.result === "Pass - Verified" ? "successful" : "queued";
    }
    return { status, result: response.result };
  };

  const waitForVerification = async (id: string): Promise<ContractVerificationStatus> => {
    const { status, result } = await getStatusById(id);
    contractVerificationStatus.value = status;
    if (status === "failed") {
      throw new ContractVerificationError(result);
    }
    if (status !== "successful") {
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
      const response: { result: string; status: string } = await FetchInstance.verificationApi(context)(
        "?module=contract&action=verifysourcecode",
        {
          method: "POST",
          body: {
            contractaddress: data.contractAddress,
            codeformat: data.codeFormat,
            contractname: data.contractName,
            compilerversion: data.compilerVersion,
            optimizationUsed: data.optimizationUsed ? "1" : "0",
            runs: data.optimizerRuns,
            constructorArguments: data.constructorArguments || undefined,
            sourceCode: data.sourceCode,
            ...(data.evmVersion && data.evmVersion !== "default" && { evmVersion: data.evmVersion }),
          },
        }
      );
      if (response.status === "0" || !response.result?.length) {
        isRequestFailed.value = true;
        contractVerificationErrorMessage.value = response.result || "Failed to send verification request";
      } else {
        await waitForVerification(response.result);
      }
    } catch (error: unknown) {
      isRequestFailed.value = true;
      if (error instanceof FetchError) {
        contractVerificationErrorMessage.value = error.data ?? error.message;
      } else if (error instanceof ContractVerificationError) {
        contractVerificationErrorMessage.value = "Unable to verify";
        compilationErrors.value = [error.message];
      }
    } finally {
      isRequestPending.value = false;
    }
  };

  const requestCompilerVersions = async (compiler: Compiler) => {
    compilerVersions.value[compiler].isRequestPending = true;
    compilerVersions.value[compiler].isRequestFailed = false;
    try {
      const versions = compiler === CompilerEnum.solc ? await getSolcVersions() : await getVyperVersions();
      compilerVersions.value[compiler].versions = versions;
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

async function getSolcVersions() {
  try {
    const response = await FetchInstance.withBaseUrl(`https://binaries.soliditylang.org/linux-amd64`)("/list.json");
    return (Object.values(response.releases || {}) as string[])
      .map((str) => `v${str.split("-v")[1]}`) // e.g. soljson-v0.8.26+commit.8a97fa7a.js or solc-linux-amd64-v0.8.26+commit.8a97fa7a
      .map(
        (str) => (str.endsWith(".js") ? str.slice(0, -3) : str) // remove .js extension
      );
  } catch (e) {
    console.error(`Failed to fetch list of solc versions: ${e}`);
    return SOLC_FULL_VERSIONS;
  }
}

async function getVyperVersions() {
  try {
    const response = await FetchInstance.withBaseUrl(`https://vyper-releases-mirror.hardhat.org`)("/list.json");
    return response
      .filter(({ assets }: { assets: unknown[] }) => assets.length)
      .map(({ tag_name }: { tag_name: string }) => tag_name.replace(/^v/, "")); // e.g. v0.1.0-beta.16 or v0.4.3
  } catch (e) {
    console.error(`Failed to fetch list of vyper versions: ${e}`);
    return VYPER_VERSIONS;
  }
}
