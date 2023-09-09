import { checksumAddress } from "./formatters";

export const ETH_TOKEN = {
  address: checksumAddress("0x000000000000000000000000000000000000800A"),
  l1Address: checksumAddress("0x0000000000000000000000000000000000000000"),
  l2Address: checksumAddress("0x000000000000000000000000000000000000800A"),
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
};

export const NEW_PROVER_CLI_URL = "https://github.com/matter-labs/era-boojum-validator-cli";

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
