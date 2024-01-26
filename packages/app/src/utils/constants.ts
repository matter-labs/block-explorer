import { checksumAddress } from "./formatters";

export const NATIVE_TOKEN_L2_ADDRESS = "0x000000000000000000000000000000000000800a";

export const ETH_TOKEN_L2_ADDRESS = checksumAddress("0x000000000000000000000000000000000000800A");

export const PROXY_CONTRACT_IMPLEMENTATION_ABI = [
  {
    inputs: [],
    name: "implementation",
    outputs: [
      {
        internalType: "address",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
