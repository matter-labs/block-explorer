/* eslint-disable  @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import useContractVerification from "@/composables/useContractVerification";

import { CompilerEnum, type ContractVerificationData } from "@/types";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => Promise.resolve()),
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
      zkCompilerVersion: "",
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
        status: "failed",
        error: "Compilation failed",
        compilationErrors: ["Some compilation error"],
      };
      const mock = ($fetch as any).mockImplementation(async (route: string) => {
        if (route.endsWith("/contract_verification")) {
          return 1;
        }
        return response;
      });
      const { compilationErrors, requestVerification } = useContractVerification();
      await requestVerification(contractData);

      expect(compilationErrors.value).toEqual(response.compilationErrors);
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
      const promise = requestCompilerVersions(CompilerEnum.zksolc);
      expect(compilerVersions.value.zksolc.isRequestPending).toEqual(true);
      await promise;
    });
    it("sets compiler isRequestPending to false when request is finished", async () => {
      const { compilerVersions, requestCompilerVersions } = useContractVerification();
      await requestCompilerVersions(CompilerEnum.zksolc);
      expect(compilerVersions.value.zksolc.isRequestPending).toEqual(false);
    });
    it("sets compiler isRequestFailed to true when request failed", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockRejectedValue(new Error());
      const { compilerVersions, requestCompilerVersions } = useContractVerification();
      await requestCompilerVersions(CompilerEnum.zksolc);

      expect(compilerVersions.value.zksolc.isRequestFailed).toEqual(true);
      mock.mockRestore();
    });
    it("sets compiler isRequestFailed to false when request success", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockResolvedValue(["v1.1.0", "v1.1.2", "v1.1.3", "v1.1.4"]);
      const { compilerVersions, requestCompilerVersions } = useContractVerification();
      await requestCompilerVersions(CompilerEnum.zksolc);

      expect(compilerVersions.value.zksolc.isRequestFailed).toEqual(false);
      mock.mockRestore();
    });
    it("sets compiler versions value correctly", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockResolvedValue(["v1.1.0", "v1.1.2", "v1.1.3", "v1.1.4"]);
      const { compilerVersions, requestCompilerVersions } = useContractVerification();
      await requestCompilerVersions(CompilerEnum.zksolc);

      expect(compilerVersions.value.zksolc.versions).toEqual(["v1.1.4", "v1.1.3", "v1.1.2", "v1.1.0"]);
      mock.mockRestore();
    });
    it("sorts compiler versions starting from the latest version", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mock = ($fetch as any).mockResolvedValue([
        "v1.1.0",
        "v1.1.11",
        "v1.1.4",
        "v1.1.111",
        "v1.1.1",
        "v1.1.100",
        "v1.1.3",
        "v1.1.5",
        "v1.1.10",
        "v1.1.2",
      ]);
      const { compilerVersions, requestCompilerVersions } = useContractVerification();
      await requestCompilerVersions(CompilerEnum.zksolc);

      expect(compilerVersions.value.zksolc.versions).toEqual([
        "v1.1.111",
        "v1.1.100",
        "v1.1.11",
        "v1.1.10",
        "v1.1.5",
        "v1.1.4",
        "v1.1.3",
        "v1.1.2",
        "v1.1.1",
        "v1.1.0",
      ]);
      mock.mockRestore();
    });
  });
});
