import { describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import useTransactionData, { decodeDataWithABI, type TransactionData } from "@/composables/useTransactionData";

import ERC20ProxyVerificationInfo from "@/../mock/contracts/ERC20ProxyVerificationInfo.json";
import ERC20VerificationInfo from "@/../mock/contracts/ERC20VerificationInfo.json";

import type { AbiFragment } from "@/composables/useAddress";
import type { Address } from "@/types";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => Promise.resolve(ERC20VerificationInfo)),
    FetchError: function error() {
      this.response = {
        status: 404,
      };
    },
  };
});
const getContractProxyInfoMock = vi.fn(() => {
  return ERC20VerificationInfo
    ? {
        implementation: {
          verificationInfo: {
            artifacts: ERC20VerificationInfo.artifacts,
          },
        },
      }
    : null;
});

vi.mock("@/composables/useAddress", () => {
  return {
    default: () => ({
      getContractProxyInfo: getContractProxyInfoMock,
    }),
  };
});

const transactionData = {
  contractAddress: "0x0cC725E6Ba24E7dB79f62f22a7994a8ee33aDc1b",
  calldata:
    "0xa9059cbb000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f0440000000000000000000000000000000000000000000000000000000000000001",
  value: "0x0",
  sighash: "0xa9059cbb",
  factoryDeps: null,
} as TransactionData;
const transactionDataDecodedMethod = {
  name: "transfer",
  inputs: [
    {
      name: "recipient",
      type: "address",
      value: "0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044",
      encodedValue: "000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f044",
    },
    {
      name: "amount",
      type: "uint256",
      value: "1",
      encodedValue: "0000000000000000000000000000000000000000000000000000000000000001",
    },
  ],
} as TransactionData["method"];

describe("useTransactionData:", () => {
  it("creates useTransactionData composable", () => {
    const result = useTransactionData();
    expect(result.data).toBeDefined();
    expect(result.isDecodePending).toBeDefined();
    expect(result.decodingError).toBeDefined();
    expect(result.decodeTransactionData).toBeDefined();
  });
  it("sets isDecodePending to true when decode data is pending", async () => {
    const { isDecodePending, decodeTransactionData } = useTransactionData();
    const promise = decodeTransactionData(transactionData);
    expect(isDecodePending.value).toEqual(true);
    await promise;
  });
  it("sets isDecodePending to false when decode data is completed", async () => {
    const { isDecodePending, decodeTransactionData } = useTransactionData();
    await decodeTransactionData(transactionData);
    expect(isDecodePending.value).toEqual(false);
  });
  it("returns raw data in case account request failed", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockRejectedValue(new Error("An error occurred"));
    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    const dataWithNewAddress = {
      ...transactionData,
      contractAddress: "0x1232c03b2cf6ede46500e799de79a15df44929eb" as Address,
    };
    await decodeTransactionData(dataWithNewAddress);
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("contract_request_failed");
    expect(data.value).toEqual(dataWithNewAddress);
    mock.mockRestore();
  });
  it("returns raw data in case contract is not verified", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockRejectedValue(new FetchError("404"));
    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    const dataWithNewAddress = {
      ...transactionData,
      contractAddress: "0x1233c03b2cf6ede46500e799de79a15df44929eb" as Address,
    };
    await decodeTransactionData(dataWithNewAddress);
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("contract_not_verified");
    expect(data.value).toEqual(dataWithNewAddress);
    mock.mockRestore();
  });
  it("sets error message when decoding failed", async () => {
    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    await decodeTransactionData({
      ...transactionData,
      calldata: "0xa9059cbb00",
    });
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("data_decode_failed");
    expect(data.value).toEqual({ ...transactionData, calldata: "0xa9059cbb00" });
  });
  it("decodes data successfully", async () => {
    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    await decodeTransactionData(transactionData);
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("");
    expect(data.value).toEqual({ ...transactionData, method: transactionDataDecodedMethod });
  });
  it("sets error message when decoding failed for a proxy contract", async () => {
    ($fetch as unknown as SpyInstance).mockResolvedValueOnce(ERC20ProxyVerificationInfo);
    const getProxyInfoMock = getContractProxyInfoMock.mockResolvedValueOnce(null);
    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    const dataWithNewAddress = {
      ...transactionData,
      contractAddress: "0x1235c03b2cf6ede46500e799de79A15dF44929eb" as Address,
    };
    await decodeTransactionData(dataWithNewAddress);
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("data_decode_failed");
    expect(data.value).toEqual({ ...transactionData, contractAddress: "0x1235c03b2cf6ede46500e799de79A15dF44929eb" });
    getProxyInfoMock.mockRestore();
  });
  it("decodes data successfully for a proxy contract", async () => {
    ($fetch as unknown as SpyInstance).mockResolvedValueOnce(ERC20ProxyVerificationInfo);
    const mock = ($fetch as unknown as SpyInstance).mockResolvedValueOnce(ERC20VerificationInfo);
    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    const dataWithNewAddress = {
      ...transactionData,
      contractAddress: "0x1235c03b2cf6ede46500e799de79A15dF44929eb" as Address,
    };
    await decodeTransactionData(dataWithNewAddress);
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("");
    expect(data.value).toEqual({
      ...transactionData,
      contractAddress: "0x1235c03b2cf6ede46500e799de79A15dF44929eb",
      method: transactionDataDecodedMethod,
    });
    mock.mockRestore();
  });
  it("returns data with no error for empty calldata", async () => {
    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    await decodeTransactionData({ ...transactionData, calldata: "0x" });
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("");
    expect(data.value).toEqual({ ...transactionData, calldata: "0x" });
  });
  describe("decodeDataWithABI", () => {
    it("decodes data", () => {
      const result = decodeDataWithABI(transactionData, ERC20VerificationInfo.artifacts.abi as AbiFragment[]);
      expect(result).toEqual({
        name: "transfer",
        inputs: [
          {
            encodedValue: "000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f044",
            name: "recipient",
            type: "address",
            value: "0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044",
          },
          {
            encodedValue: "0000000000000000000000000000000000000000000000000000000000000001",
            name: "amount",
            type: "uint256",
            value: "1",
          },
        ],
      });
    });
    it("doesn't decode data if calldata is empty (0x)", () => {
      const result = decodeDataWithABI(
        {
          ...transactionData,
          calldata: "0x",
        },
        ERC20VerificationInfo.artifacts.abi as AbiFragment[]
      );
      expect(result).toBe(undefined);
    });
  });
});
