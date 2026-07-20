/* eslint-disable  @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import useContractVerification from "@/composables/useContractVerification";

import type { SpyInstance } from "vitest";

import { CompilerEnum, type ContractVerificationData } from "@/types";

vi.mock("ohmyfetch", () => {
  const fetchSpy = vi.fn(() => Promise.resolve({ releases: {} }));
  (fetchSpy as unknown as { create: SpyInstance }).create = vi.fn(() => fetchSpy);
  return {
    $fetch: fetchSpy,
    FetchError: function error() {
      return;
    },
  };
});

describe("useContractVerification:", () => {
  it("creates useContractVerification composable", () => {
    const result = useContractVerification();
    expect(result.isRequestPending).toBeDefined();
    expect(result.isRequestFailed).toBeDefined();
    expect(result.contractVerificationErrorMessage).toBeDefined();
    expect(result.compilationErrors).toBeDefined();
    expect(result.contractVerificationStatus).toBeDefined();
    expect(result.requestVerification).toBeDefined();
    expect(result.compilerVersions).toBeDefined();
  });
  describe("requestVerification:", () => {
    const contractData = {
      codeFormat: "solidity-single-file",
      contractAddress: "",
      contractName: "",
      optimizationUsed: false,
      sourceCode: "",
      compilerVersion: "",
      constructorArguments: "",
    } as ContractVerificationData;
    it("sets isRequestPending to true when request is pending", async () => {
      const { isRequestPending, requestVerification } = useContractVerification();
      const promise = requestVerification(contractData);
      expect(isRequestPending.value).toEqual(true);
      await promise;
    });
    it("sets isRequestPending to false when request is finished", async () => {
      const { isRequestPending, requestVerification } = useContractVerification();
      await requestVerification(contractData);
      expect(isRequestPending.value).toEqual(false);
    });
    it("sets contractVerificationErrorMessage to error message when request failed", async () => {
      const error = new FetchError();
      error.message = "An request error occurred";
      const mock = ($fetch as any).mockRejectedValue(error);
      const { contractVerificationErrorMessage, isRequestFailed, requestVerification } = useContractVerification();
      await requestVerification(contractData);

      expect(isRequestFailed.value).toEqual(true);
      expect(contractVerificationErrorMessage.value).toEqual("An request error occurred");
      mock.mockRestore();
    });
    it("sets compilationErrors when compilation failed", async () => {
      const response = {
        status: "0",
        result: "Compilation failed",
      };
      const mock = ($fetch as any).mockImplementation(async (route: string) => {
        if (route.includes("action=verifysourcecode")) {
          return {
            status: "1",
            result: "1",
          };
        }
        return response;
      });
      const { compilationErrors, requestVerification } = useContractVerification();
      await requestVerification(contractData);

      expect(compilationErrors.value).toEqual([response.result]);
      mock.mockRestore();
    });
    it("sets isRequestFailed to true when request failed for unknown reason", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockRejectedValue(new Error("An error occurred"));
      const { isRequestFailed, requestVerification } = useContractVerification();
      await requestVerification(contractData);

      expect(isRequestFailed.value).toEqual(true);
      mock.mockRestore();
    });
  });
  describe("requestCompilerVersions:", () => {
    it("sets compiler isRequestPending to true when request is pending", async () => {
      const { compilerVersions, requestCompilerVersions } = useContractVerification();
      const promise = requestCompilerVersions(CompilerEnum.solc);
      expect(compilerVersions.value.solc.isRequestPending).toEqual(true);
      await promise;
    });
    it("sets compiler isRequestPending to false when request is finished", async () => {
      const { compilerVersions, requestCompilerVersions } = useContractVerification();
      await requestCompilerVersions(CompilerEnum.solc);
      expect(compilerVersions.value.solc.isRequestPending).toEqual(false);
    });
    it("sets compiler isRequestFailed to false when request success", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockResolvedValue({
        releases: {
          "0.8.30": "solc-linux-amd64-v0.8.30+commit.73712a01",
          "0.8.29": "solc-linux-amd64-v0.8.29+commit.ab55807c",
        },
      });
      const { compilerVersions, requestCompilerVersions } = useContractVerification();
      await requestCompilerVersions(CompilerEnum.solc);

      expect(compilerVersions.value.solc.isRequestFailed).toEqual(false);
      mock.mockRestore();
    });
    it("sets compiler versions value correctly", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockResolvedValue({
        releases: {
          "0.8.30": "solc-linux-amd64-v0.8.30+commit.73712a01",
          "0.8.29": "solc-linux-amd64-v0.8.29+commit.ab55807c",
        },
      });
      const { compilerVersions, requestCompilerVersions } = useContractVerification();
      await requestCompilerVersions(CompilerEnum.solc);

      expect(compilerVersions.value.solc.versions).toEqual(["v0.8.30+commit.73712a01", "v0.8.29+commit.ab55807c"]);
      mock.mockRestore();
    });
  });
});
