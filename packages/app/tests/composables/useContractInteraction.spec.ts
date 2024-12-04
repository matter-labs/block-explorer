import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ethers from "ethers";

import { useWalletMock } from "../mocks";

import useContractInteraction, { PAYABLE_AMOUNT_PARAM_NAME } from "@/composables/useContractInteraction";

import type { AbiFragment } from "@/composables/useAddress";

vi.mock("ethers", async () => {
  const actualEthers = await vi.importActual("ethers");
  return {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ...actualEthers,
    Contract: class {
      async transfer() {
        return "Test response";
      }
    },
  };
});

const abiFragment: AbiFragment = {
  inputs: [{ internalType: "address", name: "spender", type: "address" }],
  name: "transfer",
  outputs: [{ internalType: "bool", name: "", type: "bool" }],
  stateMutability: "nonpayable",
  type: "function",
};

describe("useContractInteraction:", () => {
  it("creates useContractInteraction composable", () => {
    const result = useContractInteraction();
    expect(result.isRequestPending).toBeDefined();
    expect(result.isRequestFailed).toBeDefined();
    expect(result.response).toBeDefined();
    expect(result.writeFunction).toBeDefined();
    expect(result.readFunction).toBeDefined();
  });
  describe("readFunction:", () => {
    it("sets response message", async () => {
      const { response, readFunction } = useContractInteraction();
      await readFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(response.value?.message).toEqual("Test response");
    });
    it("sets isRequestPending to true when request is pending", async () => {
      const { isRequestPending, readFunction } = useContractInteraction();
      const promise = readFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(isRequestPending.value).toEqual(true);
      await promise;
    });
    it("sets isRequestPending to false when request is finished", async () => {
      const { isRequestPending, readFunction } = useContractInteraction();
      await readFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(isRequestPending.value).toEqual(false);
    });
    it("sets isRequestFailed to true when request failed", async () => {
      const mockTransfer = vi.fn().mockRejectedValue(new Error("An error occurred"));
      const mock = vi.spyOn(ethers.Contract.prototype, "transfer").mockImplementation(mockTransfer);
      const { isRequestFailed, errorMessage, readFunction } = useContractInteraction();
      await readFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(isRequestFailed.value).toEqual(true);
      expect(errorMessage.value).toEqual("An error occurred");
      mock.mockRestore();
    });
    it("uses Signer when wallet address is not null", async () => {
      const mockGetL2Signer = vi.fn(async () => undefined);
      const walletMock = useWalletMock({
        getL2Signer: mockGetL2Signer,
        address: { value: "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b" },
      });
      const { readFunction } = useContractInteraction();
      await readFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(mockGetL2Signer).toHaveBeenCalled();
      mockGetL2Signer.mockRestore();
      walletMock.mockRestore();
    });
    it("uses Provider when wallet address is null", async () => {
      const mockGetL2Signer = vi.fn(async () => undefined);
      const walletMock = useWalletMock({ getL2Signer: mockGetL2Signer });
      const { readFunction } = useContractInteraction();
      await readFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(mockGetL2Signer).not.toHaveBeenCalled();
      mockGetL2Signer.mockRestore();
      walletMock.mockRestore();
    });
  });
  describe("writeFunction:", () => {
    beforeEach(() => {
      useWalletMock();
    });
    it("sets transaction hash to the response", async () => {
      const { response, writeFunction } = useContractInteraction();
      const mock = vi.spyOn(ethers.Contract.prototype, "transfer").mockImplementation(async () => ({
        hash: "0x8afa27556bc8cf4461ac8d1df68dab4a368aa66d2b35f778b2eb7e07fe334fe7",
      }));
      await writeFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(response.value?.transactionHash).toEqual(
        "0x8afa27556bc8cf4461ac8d1df68dab4a368aa66d2b35f778b2eb7e07fe334fe7"
      );
      mock.mockRestore();
    });
    it("correctly uses value for payable function", async () => {
      const { writeFunction } = useContractInteraction();
      const mock = vi.spyOn(ethers.Contract.prototype, "transfer").mockImplementation(async () => ({
        hash: "0x8afa27556bc8cf4461ac8d1df68dab4a368aa66d2b35f778b2eb7e07fe334fe7",
      }));
      await writeFunction(
        "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b",
        {
          ...abiFragment,
          stateMutability: "payable",
        },
        {
          [PAYABLE_AMOUNT_PARAM_NAME]: "0.1",
          address: ["0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b"],
        }
      );
      expect(mock.mock.lastCall).toEqual([
        ["0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b"],
        {
          value: ethers.parseEther("0.1"),
          from: "0x000000000000000000000000000000000000800A",
          type: 0,
        },
      ]);
      mock.mockRestore();
    });
    it("doesn't add empty arguments when there are no inputs", async () => {
      const { writeFunction } = useContractInteraction();
      const mock = vi.spyOn(ethers.Contract.prototype, "transfer").mockImplementation(async () => ({
        hash: "0x8afa27556bc8cf4461ac8d1df68dab4a368aa66d2b35f778b2eb7e07fe334fe7",
      }));
      await writeFunction(
        "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b",
        {
          ...abiFragment,
          inputs: [],
          stateMutability: "payable",
        },
        {
          [PAYABLE_AMOUNT_PARAM_NAME]: "0.1",
        }
      );
      expect(mock.mock.lastCall).toEqual([
        {
          value: ethers.parseEther("0.1"),
          from: "0x000000000000000000000000000000000000800A",
          type: 0,
        },
      ]);
      mock.mockRestore();
    });
    it("change input to boolean type", async () => {
      const { writeFunction } = useContractInteraction();
      const mock = vi.spyOn(ethers.Contract.prototype, "transfer").mockImplementation(async () => ({
        hash: "0x8afa27556bc8cf4461ac8d1df68dab4a368aa66d2b35f778b2eb7e07fe334fe7",
      }));
      await writeFunction(
        "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b",
        {
          ...abiFragment,
          inputs: [],
          stateMutability: "payable",
        },
        {
          [PAYABLE_AMOUNT_PARAM_NAME]: "0.1",
          bool: "false",
        }
      );
      expect(mock.mock.lastCall).toEqual([
        false,
        {
          value: ethers.parseEther("0.1"),
          from: "0x000000000000000000000000000000000000800A",
          type: 0,
        },
      ]);
      mock.mockRestore();
    });
    it("sets isRequestPending to true when request is pending", async () => {
      const { isRequestPending, writeFunction } = useContractInteraction();
      const promise = writeFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(isRequestPending.value).toEqual(true);
      await promise;
    });
    it("sets isRequestPending to false when request is finished", async () => {
      const { isRequestPending, writeFunction } = useContractInteraction();
      await writeFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(isRequestPending.value).toEqual(false);
    });
    it("sets isRequestFailed to true when request failed", async () => {
      const mockTransfer = vi.fn().mockRejectedValue(new Error("An error occurred"));
      const mock = vi.spyOn(ethers.Contract.prototype, "transfer").mockImplementation(mockTransfer);
      const { isRequestFailed, errorMessage, writeFunction } = useContractInteraction();
      await writeFunction("0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b", abiFragment, {});
      expect(isRequestFailed.value).toEqual(true);
      expect(errorMessage.value).toEqual("An error occurred");
      mock.mockRestore();
    });
  });
});
