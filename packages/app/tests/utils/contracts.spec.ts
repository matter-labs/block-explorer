import { describe, expect, it } from "vitest";

import type { AbiFragment } from "@/composables/useAddress";

import { getFunctionSelector } from "@/utils/contracts";

describe("contracts utils", () => {
  describe("getFunctionSelector", () => {
    it("calculates correct selector for transfer function", () => {
      const transferAbi: AbiFragment = {
        name: "transfer",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "_to", type: "address", internalType: "address" },
          { name: "_value", type: "uint256", internalType: "uint256" },
        ],
        outputs: [{ name: "", type: "bool", internalType: "bool" }],
      };

      const selector = getFunctionSelector(transferAbi);
      expect(selector).toBe("0xa9059cbb");
    });

    it("calculates correct selector for approve function", () => {
      const approveAbi: AbiFragment = {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "_spender", type: "address", internalType: "address" },
          { name: "_value", type: "uint256", internalType: "uint256" },
        ],
        outputs: [{ name: "", type: "bool", internalType: "bool" }],
      };

      const selector = getFunctionSelector(approveAbi);
      expect(selector).toBe("0x095ea7b3");
    });

    it("calculates correct selector for function with no parameters", () => {
      const totalSupplyAbi: AbiFragment = {
        name: "totalSupply",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      };

      const selector = getFunctionSelector(totalSupplyAbi);
      expect(selector).toBe("0x18160ddd");
    });

    it("calculates correct selector for function with tuple types", () => {
      const tupleAbi: AbiFragment = {
        name: "multicall",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          {
            name: "calls",
            type: "(address,bytes)[]",
            internalType: "(address,bytes)[]",
          },
        ],
        outputs: [{ name: "results", type: "bytes[]", internalType: "bytes[]" }],
      };

      const selector = getFunctionSelector(tupleAbi);
      expect(selector).toBe("0xcaa5c23f");
    });
  });
});
