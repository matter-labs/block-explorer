export const BASE_TOKEN_L2_ADDRESS = "0x000000000000000000000000000000000000800A";
export const BASE_TOKEN_L1_ADDRESS = "0x0000000000000000000000000000000000000000";
export const DEPLOYER_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000008006";
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
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export const EVM_VERSION_TO_TARGET = [
  "default",
  "homestead",
  "tangerineWhistle",
  "spuriousDragon",
  "byzantium",
  "constantinople",
  "petersburg",
  "istanbul",
  "berlin",
  "london",
  "paris",
  "shanghai",
  "cancun",
];
