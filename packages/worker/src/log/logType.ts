import { types } from "zksync-ethers";

export enum LogType {
  // ERC20
  // event Transfer(address indexed from, address indexed to, uint256 value);
  // ERC721
  // event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
  Transfer = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",

  // event Approval(address indexed owner, address indexed spender, uint256 value);
  Approval = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",

  //
  // BridgeInitialization was used first, then it was renamed to BridgeInitialize so now we should support both
  // event BridgeInitialization(address indexed l1Token, string name, string symbol, uint8 decimals);
  BridgeInitialization = "0xe6b2ac4004ee4493db8844da5db69722d2128345671818c3c41928655a83fb2c",
  // event BridgeInitialize(address indexed l1Token, string name, string symbol, uint8 decimals);
  BridgeInitialize = "0x81e8e92e5873539605a102eddae7ed06d19bea042099a437cbc3644415eb7404",
  //

  // event BridgeMint(address indexed _account, uint256 _amount);
  BridgeMint = "0x397b33b307fc137878ebfc75b295289ec0ee25a31bb5bf034f33256fe8ea2aa6",

  // event BridgeBurn(address indexed _account, uint256 _amount);
  BridgeBurn = "0x9b5b9a05e4726d8bb959f1440e05c6b8109443f2083bc4e386237d7654526553",

  // event DepositInitiated(address indexed from, address indexed to, address indexed l1Token, uint256 amount);
  DepositInitiated = "0x7abe8fd2d210cf1e5d2cb3e277afd776d77269c8869b02c39f0bb542de0fdba1",

  // event FinalizeDeposit(address indexed l1Sender, address indexed l2Receiver, address indexed l2Token, uint256 amount);
  FinalizeDeposit = "0xb84fba9af218da60d299dc177abd5805e7ac541d2673cbee7808c10017874f63",

  // event ClaimedFailedDeposit(address indexed to, address indexed l1Token, uint256 amount);
  ClaimedFailedDeposit = "0xbe066dc591f4a444f75176d387c3e6c775e5706d9ea9a91d11eb49030c66cf60",

  // event WithdrawalInitiated(address indexed l2Sender, address indexed l1Receiver, address indexed l2Token, uint256 amount);
  WithdrawalInitiated = "0x2fc3848834aac8e883a2d2a17a7514dc4f2d3dd268089df9b9f5d918259ef3b0",

  // event WithdrawalFinalized(address indexed to, address indexed l1Token, uint256 amount);
  WithdrawalFinalized = "0xac1b18083978656d557d6e91c88203585cfda1031bdb14538327121ef140d383",

  // event ContractDeployed(address indexed deployerAddress, bytes32 indexed bytecodeHash, address indexed contractAddress);
  ContractDeployed = "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",

  // event Mint(address indexed account, uint256 amount)
  Mint = "0x0f6798a560793a54c3bcfe86a93cde1e73087d944c0ea20544137d4121396885",

  // event Withdrawal(address indexed _l2Sender, address indexed _l1Receiver, uint256 _amount)
  Withdrawal = "0x2717ead6b9200dd235aad468c9809ea400fe33ac69b5bfaa6d3e90fc922b6398",
}

export const isLogOfType = (log: types.Log, types: LogType[]): boolean => {
  return types.some((type) => log.topics[0] === type);
};
