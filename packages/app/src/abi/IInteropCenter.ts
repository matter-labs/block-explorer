const IInteropCenterABI = [
  {
    type: "function",
    name: "L1_CHAIN_ID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ZK_INTEROP_FEE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ZK_TOKEN_ASSET_ID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accumulatedProtocolFees",
    inputs: [
      {
        name: "coinbase",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accumulatedZKFees",
    inputs: [
      {
        name: "coinbase",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimProtocolFees",
    inputs: [
      {
        name: "_receiver",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimZKFees",
    inputs: [
      {
        name: "_receiver",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "forwardTransactionOnGatewayWithBalanceChange",
    inputs: [
      {
        name: "_chainId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_canonicalTxHash",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "_expirationTimestamp",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "_balanceChange",
        type: "tuple",
        internalType: "struct BalanceChange",
        components: [
          {
            name: "version",
            type: "bytes1",
            internalType: "bytes1",
          },
          {
            name: "originToken",
            type: "address",
            internalType: "address",
          },
          {
            name: "baseTokenAssetId",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "baseTokenAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "assetId",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "amount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "tokenOriginChainId",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getZKTokenAddress",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "initL2",
    inputs: [
      {
        name: "_l1ChainId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "_zkTokenAssetId",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "interopBundleNonce",
    inputs: [
      {
        name: "sender",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "interopProtocolFee",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "parseAttributes",
    inputs: [
      {
        name: "_attributes",
        type: "bytes[]",
        internalType: "bytes[]",
      },
      {
        name: "_restriction",
        type: "uint8",
        internalType: "enum IInteropCenter.AttributeParsingRestrictions",
      },
    ],
    outputs: [
      {
        name: "callAttributes",
        type: "tuple",
        internalType: "struct CallAttributes",
        components: [
          {
            name: "interopCallValue",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "indirectCall",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "indirectCallMessageValue",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      {
        name: "bundleAttributes",
        type: "tuple",
        internalType: "struct BundleAttributes",
        components: [
          {
            name: "executionAddress",
            type: "bytes",
            internalType: "bytes",
          },
          {
            name: "unbundlerAddress",
            type: "bytes",
            internalType: "bytes",
          },
          {
            name: "useFixedFee",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sendBundle",
    inputs: [
      {
        name: "_destinationChainId",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "_callStarters",
        type: "tuple[]",
        internalType: "struct InteropCallStarter[]",
        components: [
          {
            name: "to",
            type: "bytes",
            internalType: "bytes",
          },
          {
            name: "data",
            type: "bytes",
            internalType: "bytes",
          },
          {
            name: "callAttributes",
            type: "bytes[]",
            internalType: "bytes[]",
          },
        ],
      },
      {
        name: "_bundleAttributes",
        type: "bytes[]",
        internalType: "bytes[]",
      },
    ],
    outputs: [
      {
        name: "bundleHash",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "setInteropFee",
    inputs: [
      {
        name: "_fee",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateL2",
    inputs: [
      {
        name: "_l1ChainId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_owner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "zkToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "FixedZKFeesAccumulated",
    inputs: [
      {
        name: "payer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "coinbase",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InteropBundleSent",
    inputs: [
      {
        name: "l2l1MsgHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "interopBundleHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "interopBundle",
        type: "tuple",
        indexed: false,
        internalType: "struct InteropBundle",
        components: [
          {
            name: "version",
            type: "bytes1",
            internalType: "bytes1",
          },
          {
            name: "sourceChainId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "destinationChainId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "destinationBaseTokenAssetId",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "interopBundleSalt",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "calls",
            type: "tuple[]",
            internalType: "struct InteropCall[]",
            components: [
              {
                name: "version",
                type: "bytes1",
                internalType: "bytes1",
              },
              {
                name: "shadowAccount",
                type: "bool",
                internalType: "bool",
              },
              {
                name: "to",
                type: "address",
                internalType: "address",
              },
              {
                name: "from",
                type: "address",
                internalType: "address",
              },
              {
                name: "value",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "data",
                type: "bytes",
                internalType: "bytes",
              },
            ],
          },
          {
            name: "bundleAttributes",
            type: "tuple",
            internalType: "struct BundleAttributes",
            components: [
              {
                name: "executionAddress",
                type: "bytes",
                internalType: "bytes",
              },
              {
                name: "unbundlerAddress",
                type: "bytes",
                internalType: "bytes",
              },
              {
                name: "useFixedFee",
                type: "bool",
                internalType: "bool",
              },
            ],
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InteropFeeUpdated",
    inputs: [
      {
        name: "oldFee",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "newFee",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "NewAssetRouter",
    inputs: [
      {
        name: "oldAssetRouter",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newAssetRouter",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "NewAssetTracker",
    inputs: [
      {
        name: "oldAssetTracker",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newAssetTracker",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProtocolFeesAccumulated",
    inputs: [
      {
        name: "coinbase",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProtocolFeesClaimed",
    inputs: [
      {
        name: "coinbase",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "receiver",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ZKFeesClaimed",
    inputs: [
      {
        name: "coinbase",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "receiver",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

export default IInteropCenterABI;
