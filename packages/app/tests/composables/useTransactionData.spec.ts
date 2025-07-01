import { beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import useTransactionData, { decodeDataWithABI, type TransactionData } from "@/composables/useTransactionData";

import type { AbiFragment } from "@/composables/useAddress";
import type { Address } from "@/types";

const ERC20VerificationInfo = {
  artifacts: {
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "transfer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
  },
};

const ERC20ProxyVerificationInfo = {
  artifacts: {
    abi: ERC20VerificationInfo.artifacts.abi,
  },
};

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => Promise.resolve(ERC20VerificationInfo)),
    FetchError: function FetchError(message: string) {
      const error = new Error(message) as Error & { response: { status: number } };
      error.name = "FetchError";
      error.response = { status: 404 };
      return error;
    },
  };
});

const getContractProxyInfoMock = vi.fn(() => {
  return ERC20VerificationInfo
    ? {
        implementation: {
          address: "0x1234567890123456789012345678901234567890",
          verificationInfo: {
            artifacts: ERC20VerificationInfo.artifacts,
          },
        },
      }
    : null;
});

const mockABICollection = vi.fn(() => ({ value: {} }));
const mockIsRequestFailed = vi.fn(() => ({ value: false }));
const mockGetCollection = vi.fn();

vi.mock("@/composables/useAddress", () => {
  return {
    default: () => ({
      getContractProxyInfo: getContractProxyInfoMock,
    }),
  };
});

vi.mock("@/composables/useContractABI", () => {
  return {
    default: () => ({
      collection: mockABICollection(),
      isRequestFailed: mockIsRequestFailed(),
      getCollection: mockGetCollection,
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
      inputs: [],
      type: "address",
      value: "0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044",
      encodedValue: "000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f044",
    },
    {
      name: "amount",
      inputs: [],
      type: "uint256",
      value: "1",
      encodedValue: "0000000000000000000000000000000000000000000000000000000000000001",
    },
  ],
} as TransactionData["method"];

describe("useTransactionData:", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockABICollection.mockReturnValue({ value: {} });
    mockIsRequestFailed.mockReturnValue({ value: false });
    mockGetCollection.mockResolvedValue(undefined);
    getContractProxyInfoMock.mockReturnValue({
      implementation: {
        address: "0x1234567890123456789012345678901234567890",
        verificationInfo: {
          artifacts: ERC20VerificationInfo.artifacts,
        },
      },
    });
  });

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
    mockIsRequestFailed.mockReturnValue({ value: true });

    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    const dataWithNewAddress = {
      ...transactionData,
      contractAddress: "0x1232c03b2cf6ede46500e799de79a15df44929eb" as Address,
    };
    await decodeTransactionData(dataWithNewAddress);
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("contract_request_failed");
    expect(data.value).toEqual(dataWithNewAddress);
  });
  it("returns raw data in case contract is not verified", async () => {
    // No ABI and no proxy info means not verified
    mockABICollection.mockReturnValue({ value: {} });
    getContractProxyInfoMock.mockReturnValue(null);

    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    const dataWithNewAddress = {
      ...transactionData,
      contractAddress: "0x1233c03b2cf6ede46500e799de79a15df44929eb" as Address,
    };
    await decodeTransactionData(dataWithNewAddress);
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("contract_not_verified");
    expect(data.value).toEqual(dataWithNewAddress);
  });
  it("sets error message when decoding failed", async () => {
    // Set up ABI but make it return undefined method (decode failure)
    const mockAddress = "0x0cC725E6Ba24E7dB79f62f22a7994a8ee33aDc1b";
    mockABICollection.mockReturnValue({
      value: { [mockAddress]: ERC20VerificationInfo.artifacts.abi },
    });

    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    await decodeTransactionData({
      ...transactionData,
      calldata: "0xa9059cbb00", // Invalid calldata that will fail to decode
    });
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("data_decode_failed");
    expect(data.value).toEqual({ ...transactionData, calldata: "0xa9059cbb00" });
  });
  it("decodes data successfully", async () => {
    const mockAddress = "0x0cC725E6Ba24E7dB79f62f22a7994a8ee33aDc1b";
    mockABICollection.mockReturnValue({
      value: { [mockAddress]: ERC20VerificationInfo.artifacts.abi },
    });

    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    await decodeTransactionData(transactionData);
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("");
    expect(data.value).toEqual({ ...transactionData, method: transactionDataDecodedMethod });
  });
  it("sets error message when decoding failed for a proxy contract", async () => {
    // Set up proxy info with verification info but use invalid calldata to trigger decode failure
    getContractProxyInfoMock.mockReturnValue({
      implementation: {
        address: "0x1234567890123456789012345678901234567890",
        verificationInfo: {
          artifacts: ERC20VerificationInfo.artifacts,
        },
      },
    });

    const { data, isDecodePending, decodingError, decodeTransactionData } = useTransactionData();
    const dataWithNewAddress = {
      ...transactionData,
      contractAddress: "0x1235c03b2cf6ede46500e799de79A15dF44929eb" as Address,
      calldata: "0xa9059cbb00", // Invalid calldata that will fail to decode
    };
    await decodeTransactionData(dataWithNewAddress);
    expect(isDecodePending.value).toEqual(false);
    expect(decodingError.value).toEqual("data_decode_failed");
    expect(data.value).toEqual(dataWithNewAddress);
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
            inputs: [],
            name: "recipient",
            type: "address",
            value: "0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044",
          },
          {
            encodedValue: "0000000000000000000000000000000000000000000000000000000000000001",
            inputs: [],
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
