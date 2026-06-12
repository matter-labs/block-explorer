const Iso20022TokenABI = [
  {
    type: "event",
    name: "TransferWithMemo",
    inputs: [
      { name: "from", type: "address", indexed: true, internalType: "address" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      { name: "value", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "memo", type: "bytes", indexed: false, internalType: "bytes" },
    ],
    anonymous: false,
  },
] as const;

export default Iso20022TokenABI;
